from django.shortcuts import render

def snake_game(request):
    return render(request, 'snakegame/index.html')