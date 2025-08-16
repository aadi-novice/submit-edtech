from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
import json

@csrf_exempt
def debug_token_view(request):
    """Debug endpoint to test token authentication"""
    
    # Get user from JWT token in header or query parameter
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    token_param = request.GET.get('token')
    
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif token_param:
        token = token_param
    
    debug_info = {
        'method': request.method,
        'auth_header': auth_header,
        'token_param': token_param,
        'token_found': token is not None,
        'token_length': len(token) if token else 0,
    }
    
    if not token:
        debug_info['error'] = 'No token provided'
        return HttpResponse(json.dumps(debug_info, indent=2), content_type='application/json')
    
    try:
        # Import JWT verification
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        
        debug_info.update({
            'token_valid': True,
            'user_id': user_id,
            'username': user.username,
            'email': user.email,
        })
        
    except Exception as e:
        debug_info.update({
            'token_valid': False,
            'error': str(e),
        })
    
    return HttpResponse(json.dumps(debug_info, indent=2), content_type='application/json')
