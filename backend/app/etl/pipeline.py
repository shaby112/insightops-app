"""
Core ETL Pipeline using dlt (Data Load Tool).

Features:
- DuckDB destination for data warehouse
- Incremental loading with merge strategy
- Automatic schema evolution
- State persistence for resume capability
"""

import dlt
from dlt.common.destination import Destination
from dlt.sources import DltResource
from typing import Dict, Any, List, Optional, Iterator, Generator
from datetime import datetime
import os

from app.core.config import settings
from app.core.logging import logger
from app.etl.bronze_layer import bronze_manager, SchemaChange
from app.utils.identifiers import connection_schema_name, to_uuid


class ETLPipeline:
    """
    Enterprise ETL pipeline using dlt with DuckDB destination.
    
    Supports:
    - Full and incremental syncs
    - Multiple source types (postgres, mysql, mongodb, files)
    - Automatic schema inference and evolution
    - State management for CDC
    """
    
    def __init__(self, connection_id: str, connection_name: str):
        self.connection_id = to_uuid(connection_id)
        self.connection_name = connection_name
        self.pipeline_name = f"kuantra_conn_{self.connection_id.hex}"
        self.dataset_name = connection_schema_name(self.connection_id)
        
        # Initialize dlt pipeline with DuckDB destination
        self._pipeline = dlt.pipeline(
            pipeline_name=self.pipeline_name,
            destination=dlt.destinations.duckdb(
                credentials=settings.DUCKDB_DATABASE_PATH
            ),
            dataset_name=self.dataset_name,
        )
        
        logger.info(f"ETL Pipeline initialized for connection {connection_id}")
    
    @property
    def state(self) -> Dict[str, Any]:
        """Get current pipeline state."""
        return self._pipeline.state
    
    def create_resource(
        self,
        table_name: str,
        data_generator: Generator[Dict[str, Any], None, None],
        primary_key: Optional[str] = None,
        incremental_key: Optional[str] = None,
    ) -> DltResource:
        """
        Create a streaming dlt resource for a table.
        
        Args:
            table_name: Name of the table to create
            data_generator: Generator yielding records
            primary_key: Primary key column
            incremental_key: Cursor column for incremental loads
        """
        # Normalize name for dlt
        dlt_table_name = table_name.replace(".", "_")

        # Create incremental object if key provided
        incremental = None
        if incremental_key:
            # Handle NULL values in cursor column by including them
            # This prevents IncrementalCursorPathHasValueNone errors on messy data
            incremental = dlt.sources.incremental(
                incremental_key, 
                on_cursor_value_missing='include'
            )

        @dlt.resource(
            name=dlt_table_name,
            primary_key=primary_key,
            write_disposition="merge" if primary_key else "append"
        )
        def streaming_resource(cursor_val=incremental):
            # If dlt provides a cursor_val (the last seen max value), 
            # we should technically pass it to our generator, but since
            # our generator is currently simple, we'll let it yield everything
            # and dlt will filter it Based on cursor_val automatically.
            yield from data_generator
        
        return streaming_resource
    
    def run_sync(
        self,
        tables_data: Dict[str, List[Dict[str, Any]]],
        primary_keys: Optional[Dict[str, str]] = None,
        incremental: bool = False
    ) -> Dict[str, Any]:
        """
        Run a sync operation for multiple tables.
        
        Args:
            tables_data: Dict mapping table names to their data records
            primary_keys: Optional dict mapping table names to primary key columns
            incremental: Whether this is an incremental sync
            
        Returns:
            Sync result with row counts and status
        """
        start_time = datetime.utcnow()
        primary_keys = primary_keys or {}
        
        try:
            resources = []
            for table_name, data in tables_data.items():
                # Determine primary key: use provided PK, or fallback to 'id' only if it exists in data
                pk = primary_keys.get(table_name)
                if not pk and data and len(data) > 0:
                    # Check first record for 'id' column
                    if 'id' in data[0]:
                        pk = 'id'
                
                # Use replace disposition for first run or recovery to avoid schema conflicts.
                # If incremental but no PK, fallback to 'append' as 'merge' requires a PK.
                if incremental:
                    disposition = "merge" if pk else "append"
                else:
                    disposition = "replace"

                # Normalize table name for dlt (replace dots with underscores)
                # This ensures dlt doesn't attempt to create nested schemas in DuckDB
                dlt_table_name = table_name.replace(".", "_")

                def make_resource(t_name, t_data, t_pk, t_disposition):
                    @dlt.resource(
                        name=t_name,
                        write_disposition=t_disposition,
                        primary_key=t_pk,
                    )
                    def independent_resource():
                        yield from t_data
                    return independent_resource

                resources.append(make_resource(dlt_table_name, data, pk, disposition))
            
            # Run the pipeline
            load_info = self._pipeline.run(resources)
            
            # === BRONZE LAYER: Export to Parquet ===
            all_schema_changes = []
            bronze_paths = []
            for table_name, data in tables_data.items():
                try:
                    parquet_path, schema_changes = bronze_manager.export_to_parquet(
                        connection_id=self.connection_id,
                        table_name=table_name,
                        data=data
                    )
                    if parquet_path:
                        bronze_paths.append(str(parquet_path))
                    all_schema_changes.extend(schema_changes)
                except Exception as e:
                    logger.warning(f"Bronze export failed for {table_name}: {e}")
            
            # Log schema changes requiring review
            review_required = [c for c in all_schema_changes if c.requires_review]
            if review_required:
                logger.warning(
                    f"Schema changes require review: {len(review_required)} changes"
                )
            
            # Calculate stats
            duration = (datetime.utcnow() - start_time).total_seconds()
            total_rows = sum(len(data) for data in tables_data.values())
            
            logger.info(
                f"Sync completed for connection {self.connection_id}: "
                f"{len(tables_data)} tables, {total_rows} rows in {duration:.2f}s"
            )
            
            return {
                "status": "success",
                "tables_synced": list(tables_data.keys()),
                "rows_synced": total_rows,
                "duration_seconds": duration,
                "is_incremental": incremental,
                "load_info": str(load_info),
                "bronze_paths": bronze_paths,
                "schema_changes": [c.to_dict() for c in all_schema_changes],
                "schema_review_required": len(review_required) > 0,
            }
            
        except Exception as e:
            # Self-healing: If sync fails (schema corruption or DuckDB constraint issue),
            # trigger thorough reset and full refresh
            error_str = str(e)
            is_constraint_error = "Adding columns with constraints" in error_str
            
            if incremental or is_constraint_error:
                logger.warning(f"Sync failed ({'constraint error' if is_constraint_error else 'incremental failure'}), triggering self-healing: {e}")
                
                try:
                    # 1. Pipeline drop (clears destination metadata)
                    try: self._pipeline.drop()
                    except: pass
                    
                    # 2. Close DuckDB manager handles
                    from app.services.duckdb_manager import duckdb_manager
                    try: duckdb_manager.close()
                    except: pass
                    
                    # 3. Aggressive Schema/Table Drop in DuckDB
                    import duckdb
                    conn = None
                    try:
                        conn = duckdb.connect(settings.DUCKDB_DATABASE_PATH)
                        # Drop dataset schema cascade
                        conn.execute(f"DROP SCHEMA IF EXISTS {self.dataset_name} CASCADE")
                        # Drop tables from default schema too
                        for table_name in tables_data.keys():
                            conn.execute(f"DROP TABLE IF EXISTS {table_name}")
                        conn.close()
                    except Exception as db_e:
                        logger.warning(f"Manual DuckDB cleanup failed: {db_e}")
                    finally:
                        if conn:
                            try: conn.close()
                            except: pass

                    # 4. Re-initialize and retry with full refresh
                    self.__init__(self.connection_id, self.connection_name)
                    
                    def make_retry_resource(t_name, t_data, t_pk):
                        @dlt.resource(name=t_name, write_disposition="replace", primary_key=t_pk)
                        def inner_resource():
                            yield from t_data
                        return inner_resource
                    
                    resources = []
                    for name, data in tables_data.items():
                        # Use smarter PK detection in retry too
                        retry_pk = primary_keys.get(name)
                        if not retry_pk and data and len(data) > 0 and 'id' in data[0]:
                            retry_pk = 'id'
                        
                        # Normalize name for dlt
                        dlt_name = name.replace(".", "_")
                        resources.append(make_retry_resource(dlt_name, data, retry_pk))
                    
                    load_info = self._pipeline.run(resources)
                    logger.info(f"Self-healing successful for connection {self.connection_id}")
                    
                    duration = (datetime.utcnow() - start_time).total_seconds()
                    total_rows = sum(len(data) for data in tables_data.values())
                    
                    return {
                        "status": "success",
                        "tables_synced": list(tables_data.keys()),
                        "rows_synced": total_rows,
                        "duration_seconds": duration,
                        "is_incremental": False,
                        "load_info": str(load_info),
                        "bronze_paths": [], 
                        "schema_changes": [],
                        "schema_review_required": False,
                    }

                except Exception as retry_e:
                    logger.error(f"Thorough self-healing failed: {retry_e}")
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Sync failed for connection {self.connection_id}: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "duration_seconds": duration,
                "is_incremental": incremental,
            }
    
    def run_incremental_sync(
        self,
        source_generator: Generator[Dict[str, Any], None, None],
        table_name: str,
        primary_key: str = "id",
        cursor_path: str = "updated_at",
        initial_value: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run an incremental sync using dlt's built-in incremental loading.
        
        Args:
            source_generator: Generator that yields records
            table_name: Target table name
            primary_key: Primary key column
            cursor_path: Column to track for incremental (e.g., updated_at)
            initial_value: Initial cursor value (ISO datetime string)
        """
        start_time = datetime.utcnow()
        
        try:
            @dlt.resource(
                name=table_name,
                write_disposition="merge",
                primary_key=primary_key,
            )
            def incremental_resource(
                cursor=dlt.sources.incremental(
                    cursor_path,
                    initial_value=initial_value or "1970-01-01T00:00:00Z"
                )
            ):
                for record in source_generator:
                    # Only yield records newer than cursor
                    if cursor_path in record:
                        record_cursor = record[cursor_path]
                        if isinstance(record_cursor, datetime):
                            record_cursor = record_cursor.isoformat()
                        if record_cursor > cursor.last_value:
                            yield record
                    else:
                        yield record
            
            load_info = self._pipeline.run(incremental_resource())
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            return {
                "status": "success",
                "table": table_name,
                "duration_seconds": duration,
                "is_incremental": True,
                "load_info": str(load_info),
            }
            
        except Exception as e:
            logger.error(f"Incremental sync failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "is_incremental": True,
            }
    
    def get_synced_tables(self) -> List[str]:
        """Get list of tables synced by this pipeline."""
        try:
            # Query DuckDB for tables in this dataset
            from app.services.duckdb_manager import duckdb_manager
            
            result = duckdb_manager.execute(
                f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{self.dataset_name}'"
            )
            return [row["table_name"] for row in result]
        except Exception as e:
            logger.error(f"Failed to get synced tables: {e}")
            return []
    
    def get_table_row_count(self, table_name: str) -> int:
        """Get row count for a specific table."""
        try:
            from app.services.duckdb_manager import duckdb_manager
            
            result = duckdb_manager.execute(
                f"SELECT COUNT(*) as count FROM {self.dataset_name}.{table_name}"
            )
            return result[0]["count"] if result else 0
        except Exception as e:
            logger.error(f"Failed to get row count for {table_name}: {e}")
            return 0
    
    def drop_dataset(self) -> bool:
        """Drop all tables for this connection's dataset."""
        try:
            from app.services.duckdb_manager import duckdb_manager
            
            tables = self.get_synced_tables()
            for table in tables:
                duckdb_manager.drop_table(f"{self.dataset_name}.{table}")
            
            logger.info(f"Dropped dataset for connection {self.connection_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to drop dataset: {e}")
            return False
