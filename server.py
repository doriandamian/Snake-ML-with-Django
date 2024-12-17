import asyncio
import websockets
import json

# Define the WebSocket server
async def handle_client(websocket):  # Ensure both parameters are included
    print("Client connected")
    try:
        async for message in websocket:
            print(f"Received from client: {message}")
            
            # Parse the incoming JSON data
            data = json.loads(message)
            client_name = data.get("name", "Anonymous")
            client_message = data.get("message", "No message")

            # Create a response
            response = {
                "direction":"up"
            }

            # Send the response back to the client
            await websocket.send(json.dumps(response))
            print(f"Sent to client: {response}")

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

# Start the WebSocket server
async def main():
    # Pass `handle_client` explicitly to `websockets.serve`
    async with websockets.serve(handle_client, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped.")