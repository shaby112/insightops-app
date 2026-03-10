import json
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.agents.tools import get_semantic_model, execute_analytical_query, get_current_time
from app.semantic.wren_client import WrenClient

# Google ADK imports (optional for local/no-ADK deployments)
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

class ChatService:
    def __init__(self):
        self.wren_client = WrenClient()
        self.agent = None

        if settings.AI_PROVIDER == "gemini" and ADK_AVAILABLE:
            # Initialize the ADK Agent
            self.model = Gemini(model=settings.LLM_MODEL)
            self.tools = [
                FunctionTool(get_semantic_model),
                FunctionTool(execute_analytical_query),
                FunctionTool(get_current_time),
            ]
            self.agent = Agent(
                name="InsightsAgent",
                model=self.model,
                tools=self.tools,
                instruction="""
                You are an expert Data Analyst for Kuantra.
                Your goal is to answer user questions by analyzing their data.

                WORKFLOW:
                1. Understand the user's question.
                2. Call `get_semantic_model()` to understand schema and relationships.
                3. Formulate a read-only DuckDB SQL query.
                4. Call `execute_analytical_query(sql)` to get data.
                5. Analyze and synthesize a natural language answer.

                SAFETY:
                - NEVER execute UPDATE, DELETE, DROP, or INSERT queries.
                - If a user asks to modify data, refuse and explain read-only constraints.
                """,
            )
        else:
            if settings.AI_PROVIDER == "gemini" and not ADK_AVAILABLE:
                logger.warning(
                    "google.adk is not installed. Chat ADK path is disabled; "
                    "falling back to semantic local path."
                )
            logger.info("ChatService running in local provider mode (semantic fallback path).")

    async def process_message_async(self, message: str) -> Dict[str, Any]:
        """
        Process a user message asynchronously using the ADK Agent.
        """
        try:
            if self.agent is None:
                # Local-provider fallback path using unified semantic layer client.
                result = await self.wren_client.generate_and_execute(message)
                if result.get("status") == "success":
                    preview_rows = result.get("data", [])[:20]
                    return {
                        "content": json.dumps(
                            {
                                "sql": result.get("sql"),
                                "row_count": result.get("row_count", len(preview_rows)),
                                "data": preview_rows,
                            },
                            default=str,
                        ),
                        "sql": result.get("sql"),
                        "isDangerous": False,
                    }
                return {
                    "content": result.get("error", "Failed to process request."),
                    "sql": result.get("sql"),
                    "isDangerous": False,
                }

            full_text = ""
            # Iterate over the async generator from run_async
            async for event in self.agent.run_async(message):
                # Using 'get_model_response()' or similar to get text chunks?
                # Inspecting 'Event' structure or just assuming it has text.
                # Common ADK pattern: event might be a ModelResponse or have text.
                # Helper: extracting text from event
                if hasattr(event, 'text'):
                     full_text += event.text or ""
                elif hasattr(event, 'part') and hasattr(event.part, 'text'):
                     full_text += event.part.text or ""
            
            return {
                "content": full_text,
                "sql": self._extract_sql_from_history(getattr(self.agent, 'history', [])),
                "isDangerous": False
            }
        except Exception as e:
            logger.error(f"Agent processing failed: {e}")
            return {
                "content": f"Error: {str(e)}",
                "sql": None,
                "isDangerous": False
            }

    # Keep sync method for legacy or testing if needed, but it won't work with run_live
    def process_message(self, message: str) -> Dict[str, Any]:
         raise NotImplementedError("Use process_message_async")

    def _extract_sql_from_history(self, history: List[Any]) -> Optional[str]:
        """Helper to find the last SQL query executed by the agent."""
        # This depends on ADK history structure. 
        # For now, we'll try to find tool calls to 'execute_analytical_query'
        for event in reversed(history):
            if hasattr(event, 'tool_calls'):
                for call in event.tool_calls:
                    if call.name == 'execute_analytical_query':
                        return call.args.get('sql')
        return None

    def execute_query(self, sql: str) -> List[Dict[str, Any]]:
        # Helper for direct execution if needed (legacy support)
        return execute_analytical_query(sql)

chat_service = ChatService()
