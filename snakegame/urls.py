from django.urls import path
from . import views

urlpatterns = [
    path('play', views.snake_game_play, name='snake_game_play'),
    path('ai', views.snake_game_ai, name="snake_game_ai"),
]