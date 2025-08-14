import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, Mail } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    const success = await forgotPassword(email);
    setLoading(false);

    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-2xl shadow-lg mb-4">
              <Mail className="h-8 w-8 text-success-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground mt-2">We've sent reset instructions to your email</p>
          </div>

          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your email and follow the instructions to reset your password.
                  If you don't see the email, check your spam folder.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive reset instructions</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">Forgot Your Password?</CardTitle>
            <CardDescription>
              No worries! Enter your email and we'll send you reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={error ? 'border-destructive' : ''}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;