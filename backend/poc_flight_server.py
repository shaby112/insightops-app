import pyarrow as pa
import pyarrow.flight as flight
import duckdb
import threading

class KuantraFlightServer(flight.FlightServerBase):
    def __init__(self, location, duckdb_path=":memory:", **kwargs):
        super(KuantraFlightServer, self).__init__(location, **kwargs)
        self.con = duckdb.connect(duckdb_path)
        # Create some dummy data for the PoC
        self.con.execute("CREATE TABLE users AS SELECT * FROM (VALUES (1, 'Alice'), (2, 'Bob')) AS t(id, name)")

    def get_flight_info(self, context, descriptor):
        # In a real app, descriptor.command could be the SQL query
        query = descriptor.command.decode('utf-8')
        
        # We need the schema of the result
        # DuckDB pyarrow integration gives us a pyarrow Table
        table = self.con.execute(query).arrow()
        
        # Create a flight endpoint
        endpoints = [flight.FlightEndpoint(descriptor.command, [self.location])]
        
        return flight.FlightInfo(table.schema, descriptor, endpoints, table.num_rows, table.nbytes)

    def do_get(self, context, ticket):
        query = ticket.ticket.decode('utf-8')
        table = self.con.execute(query).arrow()
        return flight.RecordBatchStream(table)

def start_server():
    location = flight.Location.for_grpc_tcp("0.0.0.0", 8815)
    server = KuantraFlightServer(location)
    print("Started Apache Arrow Flight Server on port 8815")
    server.serve()

if __name__ == '__main__':
    start_server()
