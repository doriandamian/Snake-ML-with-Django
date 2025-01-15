from django.shortcuts import render

def snake_game_play(request):
    return render(request, 'snakegame/snake_play.html')

def snake_game_ai(request):
    return render(request, 'snakegame/snake_ai.html')