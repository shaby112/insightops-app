import prql_python as prql
from app.core.logging import logger

def compile_prql_to_sql(prql_query: str, target: str = "sql.duckdb") -> str:
    """
    Compiles a PRQL query string into a DuckDB-compatible SQL query string.
    """
    try:
        # PRQL compilation options
        options = prql.CompileOptions(
            format=True,
            signature_comment=True,
            target=target
        )
        sql_query = prql.compile(prql_query, options)
        return sql_query
    except Exception as e:
        logger.error(f"Failed to compile PRQL to SQL: {e}")
        raise ValueError(f"PRQL compilation error: {str(e)}")

def is_prql(query: str) -> bool:
    """
    Basic heuristic to detect if a query is PRQL instead of standard SQL.
    PRQL queries typically start with 'from'.
    """
    first_word = query.strip().split()[0].lower() if query.strip() else ""
    # SQL usually starts with SELECT or WITH. PRQL usually starts with 'from'.
    if first_word == 'from':
        return True
    return False
