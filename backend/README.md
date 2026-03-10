# Kuantra Backend

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Structure
- `app/api`: API endpoints
- `app/core`: Configuration
- `app/db`: Database connection and models
- `app/services`: Business logic
