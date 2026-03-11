import pyarrow.flight as flight
import json

def run_client():
    location = flight.Location.for_grpc_tcp("localhost", 8815)
    client = flight.FlightClient(location)
    
    query = "SELECT * FROM users"
    
    # Get flight info
    descriptor = flight.FlightDescriptor.for_command(query.encode('utf-8'))
    flight_info = client.get_flight_info(descriptor)
    
    print("Schema from FlightInfo:")
    print(flight_info.schema)
    
    # Get data
    endpoint = flight_info.endpoints[0]
    reader = client.do_get(endpoint.ticket)
    
    # Convert to pandas/dict just to show it works
    table = reader.read_all()
    print("\nData retrieved:")
    print(table.to_pandas())

if __name__ == '__main__':
    run_client()
