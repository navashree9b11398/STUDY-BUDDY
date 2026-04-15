import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Enter your password'),
});


type LoginForm = z.infer<typeof loginSchema>;


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) { setError(error.message ?? 'Invalid login credentials.'); return; }
      if (!signInData?.session) { setError('Login did not complete. Please try again.'); return; }
      navigate('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">


      {/* Animated blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />


      <div className="relative z-10 w-full max-w-md animate-fade-in-up">


        {/* Logo */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-18 h-18 mb-4 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-white animate-float" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">StudyBuddy AI</h1>
          <p className="text-muted-foreground text-sm">Your smart study companion</p>
        </div>


        {/* Card */}
        <Card className="glass bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-slate-700/50 shadow-2xl shadow-blue-100/50 dark:shadow-slate-900/50 animate-fade-in-up delay-100">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-bold">Welcome back</CardTitle>
            <CardDescription className="text-center">Sign in to continue your studies</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">


              <div className="space-y-1.5 animate-fade-in-up delay-150">
                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 rounded-xl border-border/50 focus:border-primary transition-all duration-200 hover:border-primary/40"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
              </div>


              <div className="space-y-1.5 animate-fade-in-up delay-200">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-11 rounded-xl border-border/50 focus:border-primary transition-all duration-200 hover:border-primary/40"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
              </div>


              {error && (
                <Alert className="border-destructive/30 bg-destructive/5 animate-scale-in">
                  <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                </Alert>
              )}


              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 animate-fade-in-up delay-250 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                )}
              </Button>
            </form>


            <div className="mt-6 text-center animate-fade-in delay-300">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground">New here?</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-primary hover:underline transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>


        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in delay-400">
          Protected by industry-standard security
        </p>
      </div>
    </div>
  );
};


export default Login;



