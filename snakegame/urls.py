from django.urls import path
from . import views

urlpatterns = [
    path('', views.snake_game, name='snake_game'),
]