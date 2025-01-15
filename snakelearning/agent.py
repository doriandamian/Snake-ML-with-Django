import torch
import asyncio
import websockets
import json
import random
import numpy as np
import os
from collections import deque
from model import Linear_QNet, QTrainer

MAX_MEMORY = 100_000
BATCH_SIZE = 128
LR = 0.001
DIRECTIONS = ["left", "forward", "right"]

class Agent:

    def __init__(self):
        self.n_games = 0
        self.epsilon = 1
        self.min_epsilon = 0.01
        self.epsilon_decay = 0.95
        self.gamma = 0.9 
        self.memory = deque(maxlen=MAX_MEMORY)
        self.model = Linear_QNet(11, 256, 3)
        self.load_model()
        self.trainer = QTrainer(self.model, lr=LR, gamma=self.gamma)
        self.last_state = None
        self.last_action = None

    def load_model(self):
        model_path = './model/model.pth'
        if os.path.exists(model_path):
            print("Loading pre-trained model...")
            self.model.load_state_dict(torch.load(model_path, weights_only=True))
            self.model.train() 
        else:
            print("No pre-trained model found, starting fresh.")

    def get_action(self, state):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)
        if random.random() < self.epsilon:
            action = random.randint(0, len(DIRECTIONS) - 1)
        else:
            state0 = torch.tensor(state, dtype=torch.float)
            prediction = self.model(state0)
            action = torch.argmax(prediction).item()
        return action

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def train_short_memory(self, state, action, reward, next_state, done):
        self.trainer.train_step(state, action, reward, next_state, done)

    def train_long_memory(self):
        if len(self.memory) > BATCH_SIZE:
            mini_sample = random.sample(self.memory, BATCH_SIZE)
        else:
            mini_sample = self.memory

        states, actions, rewards, next_states, dones = zip(*mini_sample)
        self.trainer.train_step(states, actions, rewards, next_states, dones)

async def handle_client(websocket):
    print("Client connected")
    high_score = 0
    try:
        while True:
            state_message = await websocket.recv()
            state_data = json.loads(state_message)
            state = np.array(state_data["state"], dtype=int)

            action_idx = agent.get_action(state)
            agent.last_state = state
            agent.last_action = action_idx
            direction = DIRECTIONS[action_idx]
            response = {"direction": direction}
            await websocket.send(json.dumps(response))

            feedback_message = await websocket.recv()
            feedback_data = json.loads(feedback_message)
            reward = feedback_data["reward"]
            done = feedback_data["done"]
            score = feedback_data["score"]

            next_state = np.array(feedback_data["state"], dtype=int)
            agent.train_short_memory(agent.last_state, agent.last_action, reward, next_state, done)

            agent.remember(agent.last_state, agent.last_action, reward, next_state, done)

            if done:
                agent.n_games += 1
                agent.train_long_memory()

                if score > high_score:  
                    high_score = score
                if agent.n_games % 50 == 0:
                    agent.model.save()
                    agent.train_long_memory()
                print(f"Game {agent.n_games} | Score: {score} | High Score: {high_score}")

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def main():
    global agent
    agent = Agent()
    async with websockets.serve(handle_client, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped.")