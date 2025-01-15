import random
import numpy as np

class SnakeGameAI:
    def __init__(self, width=20, height=20):
        self.width = width
        self.height = height
        self.reset()

    def reset(self):
        self.snake = [(10, 10)]  # Snake starts in the center
        self.food = (random.randint(0, self.width - 1), random.randint(0, self.height - 1))
        self.direction = (0, 1)  # Moving right
        self.done = False
        return self._get_state()

    def step(self, action):
        if self.done:
            return self._get_state(), 0, True

        # Change direction based on action
        self._change_direction(action)

        # Move the snake
        head = (self.snake[0][0] + self.direction[0], self.snake[0][1] + self.direction[1])

        # Check for collisions
        if (
            head[0] < 0 or head[0] >= self.width or
            head[1] < 0 or head[1] >= self.height or
            head in self.snake
        ):
            self.done = True
            return self._get_state(), -10, True  # Penalty for crashing

        # Check if food is eaten
        reward = 0
        if head == self.food:
            self.food = (random.randint(0, self.width - 1), random.randint(0, self.height - 1))
            reward = 10  # Reward for eating food
        else:
            self.snake.pop()  # Remove tail if no food eaten

        self.snake.insert(0, head)  # Move head
        return self._get_state(), reward, False

    def _get_state(self):
        head = self.snake[0]
        food_dist = (self.food[0] - head[0], self.food[1] - head[1])
        return np.array([food_dist[0], food_dist[1], self.direction[0], self.direction[1]])

    def _change_direction(self, action):
        if action == 1:  # Left
            self.direction = (-self.direction[1], self.direction[0])
        elif action == 2:  # Right
            self.direction = (self.direction[1], -self.direction[0])