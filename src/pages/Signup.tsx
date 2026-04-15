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
import { Mail, Lock, User, Sparkles } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState<{ type: 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setAlert(null);

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const isWeakPasswordError = /weak password/i.test(error.message ?? '') || /password.*weak/i.test(error.message ?? '');
        setAlert({
          type: 'error',
          message: isWeakPasswordError
            ? 'Password is too weak. Try something simple like password123.'
            : error.message ?? 'Unable to sign up. Please try again.',
        });
        return;
      }

      if (!signUpData?.user) {
        setAlert({ type: 'error', message: 'Signup could not be completed. Please try again.' });
        return;
      }

      navigate('/login');
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            StudyBuddy AI
          </h1>
          <p className="text-gray-600">Join students and master your studies</p>
        </div>

        <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Sign up to get started with StudyBuddy AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Simple password like password123"
                    className="pl-10 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">Tip: Simple passwords like password123 are allowed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {alert && (
                <Alert className={alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}>
                  <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-amber-800'}>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg active:scale-95"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Your account is secure and private
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Signup;