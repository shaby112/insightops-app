import json
from typing import List, Dict, Any, Optional
import sqlglot
from sqlglot import exp
from app.core.config import settings
from app.core.logging import logger
from app.schemas.dashboard import PlanningResponse, DashboardPlan
from app.agents.tools import get_semantic_model, execute_analytical_query

# Google ADK imports (optional for deployments that disable ADK/local-only mode)
try:
    from google.adk import Agent
    from google.adk.models import Gemini
    from google.adk.tools import FunctionTool
    ADK_AVAILABLE = True
except ImportError:
    Agent = None  # type: ignore[assignment]
    Gemini = None  # type: ignore[assignment]
    FunctionTool = None  # type: ignore[assignment]
    ADK_AVAILABLE = False

class DashboardAgentService:
    def __init__(self):
        self.adk_enabled = settings.AI_PROVIDER == "gemini" and ADK_AVAILABLE
        self.model = None
        self.sql_model = None
        if self.adk_enabled:
            # Gemini model with low temperature for deterministic planning
            self.model = Gemini(model=settings.LLM_MODEL, temperature=0.2)
            self.sql_model = Gemini(model=settings.LLM_MODEL, temperature=0.1)
        else:
            if settings.AI_PROVIDER == "gemini" and not ADK_AVAILABLE:
                logger.warning(
                    "google.adk is not installed. Dashboard ADK path is disabled; "
                    "falling back to non-ADK behavior."
                )
            logger.info("DashboardAgentService running with local provider fallback (ADK disabled).")

    @staticmethod
    def _is_read_only_sql(sql: str) -> bool:
        try:
            parsed = sqlglot.parse(sql, read="duckdb")
            if not parsed:
                return False
            dangerous = (
                exp.Delete,
                exp.Update,
                exp.Drop,
                exp.TruncateTable,
                exp.Insert,
                exp.Alter,
                exp.Create,
            )
            for statement in parsed:
                if isinstance(statement, dangerous):
                    return False
                for node in statement.walk():
                    if isinstance(node, dangerous):
                        return False
            return True
        except Exception:
            sql_upper = sql.upper().strip()
            if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
                return False
            return not any(
                keyword in sql_upper
                for keyword in ["DELETE ", "DROP ", "UPDATE ", "INSERT ", "TRUNCATE ", "ALTER ", "CREATE "]
            )

    async def plan_dashboard(self, query: str, history: List[Dict[str, str]], user_id: str, connection_ids: Optional[List[str]] = None) -> PlanningResponse:
        """
        Interactively plans a dashboard using ADK Agent.
        """
        try:
            if not self.adk_enabled:
                return PlanningResponse(
                    status="clarifying",
                    question=(
                        "Dashboard planning in local provider mode currently requires explicit metrics and breakdowns. "
                        "Please provide metrics, dimensions, and preferred widget types."
                    ),
                )

            # specialized tool to capture the plan structure
            plan_capturer = {"result": None}
            
            def submit_dashboard_plan(status: str, question: str, plan: Dict[str, Any] = None):
                """
                Submit the final dashboard plan or a clarifying question.
                
                Args:
                    status: "ready" if plan is complete, "clarifying" if more info needed.
                    question: Clarifying question for the user (if status="clarifying").
                    plan: The dashboard plan object (if status="ready"). 
                          Must include 'title', 'metrics' (list), 'visualizations' (list), 'time_range'.
                """
                plan_capturer["result"] = PlanningResponse(
                    status=status,
                    question=question,
                    plan=DashboardPlan(**plan) if plan else None
                )
                return "Plan submitted successfully."

            def get_scoped_semantic_model():
                return get_semantic_model(connection_ids=connection_ids)

            # Setup Agent with tools
            tools = [
                FunctionTool(get_scoped_semantic_model),
                FunctionTool(submit_dashboard_plan)
            ]
            
            agent = Agent(
                name="DashboardPlanner",
                model=self.model,
                tools=tools,
                instruction="""
                You are an expert Dashboard Planning Agent for Kuantra.
                Your goal is to create a structured dashboard plan based on the user's request and database schema.
                
                WORKFLOW:
                1. Call `get_scoped_semantic_model()` to inspect the available data.
                2. If the user's request is vague, call `submit_dashboard_plan(status='clarifying', question=...)`.
                3. If request is clear, design a dashboard with 3-6 widgets.
                   - Choose appropriate visualizations (line, bar, number, table).
                   - Select metrics and dimensions from the schema.
                   - Layout the widgets on a 12-column grid (x, y, w, h).
                4. Call `submit_dashboard_plan(status='ready', plan=...)` to finalize.
                """
            )
            
            # Construct conversation history
            # basic concatenation for now as ADK handles history internally in session
            # For a stateless service call, we just prompt with history context
            context_prompt = f"History: {json.dumps(history)}\nUser Request: {query}"
            
            # Run agent asynchronously
            async for _ in agent.run_async(context_prompt):
                pass # Consume stream to let tools execute
            
            if plan_capturer["result"]:
                return plan_capturer["result"]
            
            # Fallback if tool wasn't called
            return PlanningResponse(status="clarifying", question="I couldn't generate a valid plan. Could you be more specific?")

        except Exception as e:
            logger.error(f"Dashboard planning failed: {e}")
            return PlanningResponse(status="clarifying", question=f"Error planning dashboard: {str(e)}")


    async def generate_widget_data(
        self,
        viz: Any,
        user_id: str,
        aggregations: Optional[Dict[str, str]] = None,
        connection_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generates SQL for a single visualization using ADK Agent and executes it.
        """
        try:
            if not self.adk_enabled:
                return {
                    "data": [],
                    "index": "error",
                    "categories": [],
                    "sql": "",
                    "error": "Dashboard SQL generation via ADK is unavailable in local provider mode.",
                }

            # Specialized agent for SQL generation
            sql_capturer = {"sql": None}
            
            def submit_sql_query(sql: str, connection_id: Optional[str] = None):
                """Submit the generated SQL query for execution."""
                sql_capturer["sql"] = sql
                # return data for agent to see? 
                # For this specific method, we return the data to frontend, so we just capture SQL.
                return "SQL captured."

            def get_scoped_semantic_model():
                return get_semantic_model(connection_ids=connection_ids)

            agent = Agent(
                name="SQLGenerator",
                model=self.sql_model,
                tools=[
                    FunctionTool(get_scoped_semantic_model),
                    FunctionTool(submit_sql_query)
                ],
                instruction="""
                You are a DuckDB SQL expert. Generate a read-only SQL query for a dashboard widget.
                
                1. Check `get_scoped_semantic_model` to find tables and columns.
                2. Write a SQL query matching the widget requirements.
                3. Use schema-qualified table names (`conn_<id>.<table>`) when connection_ids are provided.
                4. Return SELECT/WITH query only (no DML/DDL).
                5. Call `submit_sql_query` with the SQL.
                """
            )
            
            prompt = f"""
            Widget Config:
            - Metrics: {viz.metrics}
            - Type: {viz.type}
            - Breakdown: {viz.breakdown}
            - Aggregations: {aggregations}
            - Connection IDs: {connection_ids}
            
            Goal: Generate DuckDB SQL to retrieve this data. Limit 50 rows.
            """
            
            async for _ in agent.run_async(prompt):
                 pass
            
            if not sql_capturer["sql"]:
                return {"data": [], "index": "error", "categories": [], "sql": "-- No SQL generated", "error": "No SQL generated"}
                
            sql_query = sql_capturer["sql"]
            if not self._is_read_only_sql(sql_query):
                return {
                    "data": [],
                    "index": "error",
                    "categories": [],
                    "sql": sql_query,
                    "error": "Generated SQL was not read-only and was blocked.",
                }
            
            # Execute SQL
            # We use the tool directly here or existing service
            # Finding connection_id is implicit in execute_analytical_query if we passed it connection list
            # But execute_analytical_query uses duckdb_manager which queries the 'loaded' duckdb.
            # Assuming DuckDB has all connections synced.
            
            results = execute_analytical_query(
                sql_query,
                connection_ids=connection_ids,
                timeout_s=settings.ANALYTICAL_QUERY_TIMEOUT_SECONDS,
            )
            
            if isinstance(results, str): # Error message
                 return {"data": [], "index": "error", "categories": [], "sql": sql_query, "error": results}
                 
            # Basic transformation
            if results:
                keys = list(results[0].keys())
                index_key = keys[0]
                return {
                    "data": results,
                    "index": index_key,
                    "categories": [k for k in keys if k != index_key],
                    "sql": sql_query
                }
            
            return {"data": [], "index": "x", "categories": [], "sql": sql_query}

        except Exception as e:
            logger.error(f"Widget generation failed: {e}")
            return {"data": [], "index": "error", "categories": [], "sql": "", "error": str(e)}

dashboard_agent_service = DashboardAgentService()
