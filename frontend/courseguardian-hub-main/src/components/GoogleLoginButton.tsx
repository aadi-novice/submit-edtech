import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ className }) => {
  const { googleLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState('Initializing...');

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log('🔍 Google Client ID:', clientId);
      setDebugInfo(`Client ID: ${clientId ? 'Found' : 'Missing'}`);
      
      if (!clientId) {
        console.error('Google Client ID not found in environment variables');
        setDebugInfo('Error: No Client ID');
        return;
      }

      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        console.log('🚀 Initializing Google Sign-In...');
        setDebugInfo('Initializing Google...');
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          console.log('🎨 Rendering Google button...');
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: '100%',
            }
          );
          setIsGoogleLoaded(true);
          setDebugInfo('Google button rendered');
        }
      } else {
        console.log('⏳ Google SDK not ready yet...');
        setDebugInfo('Waiting for Google SDK...');
      }
    };

    // Check if Google script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load
      let attempts = 0;
      const checkGoogle = setInterval(() => {
        attempts++;
        console.log(`🔄 Checking for Google SDK... Attempt ${attempts}`);
        
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        } else if (attempts >= 50) { // 5 seconds
          clearInterval(checkGoogle);
          console.error('❌ Google SDK failed to load');
          setDebugInfo('Google SDK failed to load');
        }
      }, 100);
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    console.log('📝 Google response received:', response);
    if (response.credential) {
      const success = await googleLogin(response.credential);
      if (success) {
        console.log('✅ Google login successful');
      }
    } else {
      console.error('❌ No credential received from Google');
    }
  };

  // Always show a button for debugging
  return (
    <div className={`w-full ${className}`}>
      {/* Debug info */}
      <div className="text-xs text-gray-500 mb-2 text-center">
        Debug: {debugInfo}
      </div>
      
      {/* Google button container */}
      <div ref={googleButtonRef} className="w-full min-h-[44px]" />
      
      {/* Fallback button */}
      {!isGoogleLoaded && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={() => {
            console.log('🔄 Manual Google check triggered');
            setDebugInfo('Manual check...');
            // Manual retry
            setTimeout(() => {
              if (window.google?.accounts?.id) {
                setDebugInfo('Found Google SDK on retry');
                window.location.reload();
              } else {
                setDebugInfo('Still no Google SDK');
              }
            }, 1000);
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoaded ? 'Sign in with Google' : 'Retry Google Sign-In'}
        </Button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
