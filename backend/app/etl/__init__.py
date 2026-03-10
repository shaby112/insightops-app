"""
ETL Package for Kuantra Data Warehouse.

Uses dlt (Data Load Tool) for production-grade data pipelines
with automatic schema evolution, state management, and CDC support.

Medallion Architecture:
- Bronze: Raw Parquet files with schema versioning
- Silver: Materialized DuckDB tables with strategy selection
- Gold: Semantic MDL layer (coming soon)
"""

from app.etl.pipeline import ETLPipeline
from app.etl.sync_service import SyncService
from app.etl.bronze_layer import BronzeLayerManager, bronze_manager, SchemaChange, SchemaChangeType
from app.etl.silver_layer import SilverLayerManager, silver_manager, MaterializationStrategy

__all__ = [
    "ETLPipeline",
    "SyncService",
    "BronzeLayerManager",
    "bronze_manager",
    "SchemaChange",
    "SchemaChangeType",
    "SilverLayerManager",
    "silver_manager",
    "MaterializationStrategy",
]
