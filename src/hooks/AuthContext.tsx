'use client'

import { createContext, useContext, useState } from 'react'
import { useSession, signIn as authSignIn, signOut as authSignOut } from 'next-auth/react'
import { registerUser, verifyOtp, resendOtp, UserType } from '../lib/auth'
import toast from 'react-hot-toast'
import axios, { AxiosError } from 'axios'

declare module 'next-auth' {
  interface User {
    id?: string
    userType?: UserType
  }
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  userType?: string;
  image?: string | null;
}

interface Profile {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  user_type: string;
  email_verified: boolean;
}

interface Session {
  user?: User;
}

const AuthContext = createContext<{
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<void>
  signIn: (email: string, password: string, userType: string) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ status: string; message: string }>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ status: string; message: string }>
  updatePassword: () => Promise<void>
  resendVerification: () => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  createProfileForCurrentUser: () => Promise<boolean>
  checkDatabaseSetup: () => Promise<boolean>
  testBackendConnection: () => Promise<unknown>
} | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider - Manages authentication state and operations
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  const user = session?.user || null
  const profile = user ? {
    id: (user as User).id,
    full_name: user.name,
    email: user.email,
    user_type: (user as User).userType || 'STUDENT',
    email_verified: true
  } : null

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    try {
      setLoading(true)
      await registerUser({
        name: fullName,
        email,
        password,
        userType: userType as 'student' | 'instructor' | 'admin'
      })
      toast.success('Account created! You can now sign in.')
    } catch (error: unknown) {
      console.error('Signup error:', error)
      toast.error((error as Error).message || 'Failed to create account')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string, userType: string) => {
    try {
      setLoading(true)

      const result = await authSignIn('credentials', {
        email,
        password,
        userType,
        redirect: false
      })

      console.log('SignIn result:', result);

      if (result?.error) {
        const error = result.error;
        
        // Email verification errors
        if (error.includes('CallbackRouteError') || 
            error.includes('EMAIL_NOT_VERIFIED') ||
            error.includes('verify') || 
            error.includes('CredentialsSignin')) {
          const userEmail = error.includes(':') ? error.split(':')[1] : email;
          throw new Error(`EMAIL_NOT_VERIFIED:${userEmail}`);
        }
        
        // Rate limiting
        if (error.includes('Too many login attempts')) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }
        
        throw new Error(error || 'Invalid email or password');
      }

      if (!result?.ok && !result?.error) {
        throw new Error(`EMAIL_NOT_VERIFIED:${email}`);
      }

      if (result?.ok) {
        toast.success('Welcome back!')
        return;
      }

    } catch (error: unknown) {
      console.error('Sign in error:', error)
      const errorMessage = (error as Error).message || 'Failed to sign in';
      
      // Re-throw specific errors for caller to handle
      if (errorMessage.startsWith('EMAIL_NOT_VERIFIED:') || 
          errorMessage.includes('Too many login attempts')) {
        throw new Error(errorMessage);
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authSignOut({ redirect: false })
      toast.success('Signed out successfully')
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${backendUrl}/api/auth/forgot-password`, 
        { email },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      toast.success(response.data.message || 'Reset link sent if account exists');
      return response.data;
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      const axiosError = error as AxiosError;
      
      let errorMessage = 'Failed to process request';
      if (!axiosError?.response && axiosError?.request) {
        errorMessage = 'Cannot connect to server';
      } else if (axiosError?.response) {
        errorMessage = (axiosError.response.data as { message?: string })?.message || `Server error: ${axiosError.response.status}`;
      } else if (axiosError?.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server not running';
      } else if (axiosError?.code === 'TIMEOUT') {
        errorMessage = 'Request timeout';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<{ status: string; message: string }> => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/auth/reset-password/${token}`,
        { password, confirmPassword },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(response.data.message || 'Password reset successfully');
      return response.data;
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as { message?: string })?.message || 'Failed to reset password';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    toast.success('Password updated (mock)')
  }

  const resendVerification = async () => {
    toast.success('Verification sent (mock)')
  }

  const createProfileForCurrentUser = async () => true

  const checkDatabaseSetup = async () => true

  const testBackendConnection = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      await axios.get(`${backendUrl}/api/test`, { timeout: 5000 });
    } catch (error: unknown) {
      console.error('Backend test error:', error);
      const axiosError = error as AxiosError;
      const errorMessage = !axiosError.response && axiosError.request 
        ? 'Cannot reach backend' 
        : `Backend error: ${axiosError.response?.status || 'unknown'}`;
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOtp = async (email: string, otp: string) => {
    try {
      setLoading(true)
      await verifyOtp(email, otp)
      toast.success('Email verified successfully!')
    } catch (error: unknown) {
      console.error('OTP verification error:', error)
      toast.error((error as Error).message || 'Failed to verify OTP')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async (email: string) => {
    try {
      setLoading(true)
      await resendOtp(email)
      toast.success('OTP sent successfully! Please check your email.')
    } catch (error: unknown) {
      console.error('Resend OTP error:', error)
      toast.error((error as Error).message || 'Failed to resend OTP')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading: status === 'loading' || loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    updatePassword,
    resendVerification,
    verifyOtp: handleVerifyOtp,
    resendOtp: handleResendOtp,
    createProfileForCurrentUser,
    checkDatabaseSetup,
    testBackendConnection,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}