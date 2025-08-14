import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Shield, Users, ArrowRight } from 'lucide-react';
import { FullPageLoader } from '@/components/common/Loader';

const Index = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) {
    return <FullPageLoader text="Loading..." />;
  }

  if (isAuthenticated) {
    return <FullPageLoader text="Redirecting..." />;
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Courses',
      description: 'Access a wide range of educational materials and resources.',
    },
    {
      icon: Shield,
      title: 'Secure Learning',
      description: 'Protected PDF viewing with advanced security measures.',
    },
    {
      icon: Users,
      title: 'Easy Management',
      description: 'Streamlined course management and student enrollment.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-primary/5">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Learning Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl shadow-lg mb-8">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Modern Learning
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A secure, professional learning platform designed for educators and students. 
            Upload courses, manage content, and provide protected access to learning materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="min-w-[160px]">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="min-w-[160px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform provides comprehensive tools for educational content management 
              and secure learning experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="text-center py-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Join thousands of learners and educators already using our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="secondary" size="lg">
                    Create Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Learning Platform</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Learning Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
