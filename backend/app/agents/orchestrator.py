from google.adk.agents import LlmAgent
from app.agents.analyst import get_analyst_agent
from app.agents.designer import get_designer_agent

# Initialize sub-agents
analyst = get_analyst_agent()
designer = get_designer_agent()

# Define Orchestrator
orchestrator = LlmAgent(
    model="gemini-2.0-flash",
    name="Orchestrator",
    instruction="""
    You are the Kuantra Assistant Orchestrator.
    
    Your Goal: Route user requests to the appropriate specialist agent.
    
    Specialists:
    1. Data Analyst: Handles DATA questions ("Show me...", "Calculate...", "What is...").
    2. Dashboard Designer: Handles LAYOUT/UI questions ("Create a dashboard", "Move widget...").
    
    If the user greets or asks general questions, answer directly.
    If the user asks for complex tasks, DELEGATE to the specialist.
    """,
    tools=[], # In a real ADK multi-agent setup, we'd add agents as tools or use a Router.
    # For this implementation, we will use a simple tool-use pattern or direct routing if ADK supports it.
    # Assuming ADK allows calling other agents functions if wrapped as tools.
)

# Wrapper to run the orchestration
async def process_user_message(user_message: str, context: dict = None) -> str:
    """
    Process message using ADK Agents.
    """
    # Simple keyword routing for robustness if ADK multi-agent is complex to set up in one go
    # But ideally we use the LLM to decide.
    
    # We will let the Orchestrator decide via Function Calling if we wrap agents as tools.
    # However, simpler approach for now:
    
    prompt = f"User Request: {user_message}\n\nTask: Analyze the request and determine if it needs 'analysis', 'design', or 'chat'. Return ONLY one word."
    
    # Using a classification call (lightweight)
    decision = orchestrator.chat(prompt).text.strip().lower()
    
    if "analysis" in decision or "data" in decision:
        return analyst.chat(user_message).text
    elif "design" in decision or "dashboard" in decision:
        return designer.chat(user_message).text
    else:
        return orchestrator.chat(user_message).text
