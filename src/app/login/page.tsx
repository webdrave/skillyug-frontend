'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';

/**
 * Production-ready login form with proper email validation
 * Security features:
 * - Proper input validation
 * - Rate limiting protection
 * - Error handling
 * - Loading states
 * - Accessibility support
 */

// Enhanced email-only validation schema
const loginFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginResponse {
  verified?: boolean;
  needsVerification?: boolean;
  email?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
  message: string;
  rateLimitExceeded?: boolean;
  expiresIn?: number;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { 
      email: '', 
      password: '' 
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Handle verification success from URL params
  useEffect(() => {
    if (searchParams?.get('verified') === 'true') {
      toast.success('Account verified successfully! You can now log in.');
      const email = searchParams.get('email');
      if (email) {
        form.setValue('email', decodeURIComponent(email));
      }
    }
  }, [searchParams, form]);

  // Clear error when user starts typing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) setError(null);
    });
    return () => subscription.unsubscribe();
  }, [form, error]);

  async function handleLoginSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check credentials with the Express backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const checkResponse = await fetch(`${backendUrl}/api/auth/login-check`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json().catch(() => ({}));
        
        if (checkResponse.status === 429) {
          setError(errorData.error || 'Too many login attempts. Please try again later.');
          return;
        }
        
        setError(errorData.error || 'Invalid email or password');
        return;
      }

      const checkResponse_data = await checkResponse.json();
      
      // Extract the actual data from the standardized API response format
      const checkData: LoginResponse = checkResponse_data.data || checkResponse_data;

      // Step 2: Handle unverified users
      if (checkData.needsVerification) {
        toast(checkData.message, { duration: 5000 });
        router.push(`/verify-otp?email=${encodeURIComponent(checkData.email || values.email)}&resent=true`);
        return;
      }

      // Step 3: Handle verified users - proceed with NextAuth
      if (checkData.verified) {
        toast.success('Credentials verified. Logging you in...');
        
        const result = await signIn('credentials', {
          redirect: false,
          email: values.email,
          password: values.password,
        });

        if (result?.error) {
          setError('Login failed. Please try again.');
          return;
        }

        if (result?.ok) {
          toast.success('Login successful!');
          
          // Redirect based on user role
          if (checkData.user?.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
          
          router.refresh();
        }
      }
    } catch (fetchError) {
      console.error('Login error:', fetchError);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md bg-black/30 backdrop-blur-md border border-blue-800/30 shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <LogIn className="h-10 w-10 text-white" />
        </div>
        <div>
          <CardTitle className="text-3xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Sign in to your Skillyug account
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-100 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-200">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                      className="h-12 bg-white/10 border-blue-700/50 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-gray-200">
                      Password
                    </FormLabel>
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-orange-400 hover:text-orange-300 hover:underline transition-colors"
                      tabIndex={isLoading ? -1 : 0}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-12 bg-white/10 border-blue-700/50 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300 transform hover:scale-105 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-blue-700/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/30 px-3 text-gray-400 backdrop-blur-sm">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full h-12 bg-white/5 border-blue-700/50 text-gray-200 hover:bg-white/10 hover:border-blue-600 transition-all duration-300"
          disabled={isLoading}
          onClick={() => signIn('google')}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </Button>
        
        <div className="text-center text-base text-gray-300 pt-4">
          Don&apos;t have an account?{' '}
          <Link 
            href="/sign-up" 
            className="font-semibold text-orange-400 hover:text-orange-300 hover:underline transition-colors"
          >
            Create one here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-3 text-white text-lg">Loading...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
