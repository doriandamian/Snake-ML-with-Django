import torch
import torch.optim as optim
from game_ai.snake_game import SnakeGameAI
from game_ai.dqn_model import QNetwork
from collections import deque
import random
import numpy as np

# Initialize environment and model
env = SnakeGameAI()
model = QNetwork(state_size=4, action_size=3)  # 4 inputs (food, direction), 3 actions (left, right, straight)
optimizer = optim.Adam(model.parameters(), lr=0.001)
gamma = 0.95  # Discount factor

# Replay buffer to store experiences
memory = deque(maxlen=2000)

def train_dqn(episodes=1000, batch_size=64):
    epsilon = 1.0  # Exploration rate
    epsilon_min = 0.01
    epsilon_decay = 0.995

    for e in range(episodes):
        state = env.reset()
        state = torch.tensor(state, dtype=torch.float32)
        total_reward = 0

        while True:
            # Epsilon-greedy action selection
            if random.random() <= epsilon:
                action = random.randrange(3)  # Random action
            else:
                q_values = model(state)
                action = torch.argmax(q_values).item()

            # Take action and observe next state, reward, and done flag
            next_state, reward, done = env.step(action)
            next_state = torch.tensor(next_state, dtype=torch.float32)

            # Store experience in the memory buffer
            memory.append((state, action, reward, next_state, done))

            state = next_state
            total_reward += reward

            if done:
                print(f"Episode {e+1}/{episodes}, Score: {total_reward}, Epsilon: {epsilon:.2f}")
                break

            # Train the model from memory if enough data is collected
            if len(memory) > batch_size:
                minibatch = random.sample(memory, batch_size)
                for state, action, reward, next_state, done in minibatch:
                    q_values = model(state)
                    next_q_values = model(next_state)
                    target = reward + (gamma * torch.max(next_q_values).item() * (1 - done))
                    q_values[0][action] = target

                    loss = torch.nn.MSELoss()(q_values, q_values)
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()

        # Reduce epsilon after each episode
        if epsilon > epsilon_min:
            epsilon *= epsilon_decay

    # Save the trained model after training
    torch.save(model.state_dict(), "snake_dqn.pth")
    print("Model training complete and saved.")

if __name__ == "__main__":
    train_dqn()