import asyncio
import websockets
import numpy as np
import torch

import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from game_ai.snake_game import SnakeGameAI
from game_ai.dqn_model import QNetwork

# Initialize game and model
env = SnakeGameAI()
model = QNetwork(state_size=4, action_size=3)
model.load_state_dict(torch.load("snake_dqn.pth"))  # Load a trained model (if exists)
model.eval()

async def handler(websocket, path):
    state = env.reset()
    state = torch.tensor(state, dtype=torch.float32).unsqueeze(0)

    while True:
        # Predict the best action using the model
        with torch.no_grad():
            q_values = model(state)
            action = torch.argmax(q_values).item()

        # Send action to the browser
        await websocket.send(str(action))

        # Take action in the game
        next_state, reward, done = env.step(action)
        next_state = torch.tensor(next_state, dtype=torch.float32).unsqueeze(0)

        if done:
            state = env.reset()
        else:
            state = next_state

start_server = websockets.serve(handler, "localhost", 8080)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()