from sqlalchemy import create_engine, text
import time

print("Testing DB connection to port 5432...")
uri = "postgresql://postgres.erkssxplhqaxpatrcdsx:KuantraDev123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
engine = create_engine(uri, connect_args={"connect_timeout": 5})

try:
    with engine.connect() as conn:
        print("Connected to 5432!")
        result = conn.execute(text("SELECT 1"))
        print(f"Result: {result.scalar()}")
except Exception as e:
    print(f"Connection to 5432 failed: {e}")

print("\nTesting DB connection to port 6543...")
uri_6543 = "postgresql://postgres.erkssxplhqaxpatrcdsx:KuantraDev123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
engine_6543 = create_engine(uri_6543, connect_args={"connect_timeout": 5})

try:
    with engine_6543.connect() as conn:
        print("Connected to 6543!")
        result = conn.execute(text("SELECT 1"))
        print(f"Result: {result.scalar()}")
except Exception as e:
    print(f"Connection to 6543 failed: {e}")
