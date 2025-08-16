from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def simple_test_view(request):
    """Super simple test view to check if Django is accessible"""
    if request.method == 'GET':
        response = HttpResponse("Hello from Django! Server is working.", content_type='text/plain')
        response['Access-Control-Allow-Origin'] = '*'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        return response
    else:
        return JsonResponse({'method': request.method, 'working': True})
