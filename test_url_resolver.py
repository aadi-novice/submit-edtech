#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'edtech'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')

# Setup Django
django.setup()

from django.urls import resolve, Resolver404

def test_url_resolution():
    """Test if the proxy-pdf URL can be resolved"""
    url = '/api/proxy-pdf/1'
    
    try:
        resolved = resolve(url)
        print(f"✅ URL resolved successfully: {resolved}")
        print(f"Function: {resolved.func}")
        print(f"Function name: {resolved.func.__name__}")
        print(f"Args: {resolved.args}")
        print(f"Kwargs: {resolved.kwargs}")
        return True
    except Resolver404 as e:
        print(f"❌ Resolver404 error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def list_all_urls():
    """List all registered URL patterns"""
    from django.conf import settings
    from django.urls import get_resolver
    
    resolver = get_resolver(settings.ROOT_URLCONF)
    print("\n📋 All registered URL patterns:")
    
    def print_patterns(patterns, prefix=''):
        for pattern in patterns:
            if hasattr(pattern, 'url_patterns'):
                # This is an include() pattern
                print(f"  {prefix}{pattern.pattern} -> INCLUDE")
                print_patterns(pattern.url_patterns, prefix + str(pattern.pattern))
            else:
                # This is a regular pattern
                print(f"  {prefix}{pattern.pattern} -> {pattern.callback}")
    
    print_patterns(resolver.url_patterns)

if __name__ == '__main__':
    print("🔍 Testing URL resolution for /api/proxy-pdf/1")
    test_url_resolution()
    
    print("\n" + "="*60)
    list_all_urls()
