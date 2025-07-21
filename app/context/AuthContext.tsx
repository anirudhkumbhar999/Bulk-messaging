import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import supabase from '../lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true, // Start with loading true to prevent flash
  error: null,
  session: null,
};

type AuthContextType = {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  clearError: () => void;
  updateUserMetadata: (metadata: { username?: string; name?: string; avatar_url?: string }) => Promise<void>;
  fetchUserMetadata: () => Promise<{ username: string; name: string; avatar_url: string | null } | null>;
  checkUserProfile: (email: string) => Promise<{
    exists: boolean;
    hasProfile?: boolean;
    message: string;
    userId?: string;
    profile?: any;
  }>;
};

const AuthContext = createContext<AuthContextType>({
  authState: initialState,
  login: async () => false,
  signup: async () => { },
  logout: async () => { },
  clearError: () => { },
  updateUserMetadata: async () => { },
  fetchUserMetadata: async () => null,
  checkUserProfile: async () => ({ exists: false, message: 'Not initialized' }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const checkAndUpdateSession = async (session: Session | null) => {
    if (!session) {
      setAuthState(prev => ({ ...prev, ...initialState, loading: false }));
      return false;
    }

    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Verify the session with Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User verification error:', userError);
        throw new Error('Invalid session');
      }

      console.log('User verified, checking profile...');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);

        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('Creating new profile for user...');
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              username: user.email?.split('@')[0],
              created_at: new Date().toISOString(),
            }]);

          if (createError) {
            console.error('Profile creation error:', createError);
            throw new Error('Failed to create user profile');
          }

          // Fetch the newly created profile
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (fetchError || !newProfile) {
            console.error('New profile fetch error:', fetchError);
            throw new Error('Failed to fetch new user profile');
          }

          setAuthState({
            isAuthenticated: true,
            user: {
              id: user.id,
              email: user.email!,
              username: newProfile.username || user.email!.split('@')[0],
            },
            loading: false,
            error: null,
            session,
          });
        } else {
          throw new Error('Error fetching user profile');
        }
      } else {
        setAuthState({
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email!,
            username: profile.username || user.email!.split('@')[0],
          },
          loading: false,
          error: null,
          session,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Session validation error:', error.message);
      setAuthState(prev => ({
        ...prev,
        ...initialState,
        loading: false,
        error: error.message,
      }));
      await supabase.auth.signOut();
      return false;
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        checkAndUpdateSession(session);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        await checkAndUpdateSession(session);
      } else if (event === 'SIGNED_OUT') {
        setAuthState(prev => ({ ...prev, ...initialState, loading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      console.log('Attempting login with email:', email);

      // Attempt to sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before logging in');
        }
        throw new Error(error.message);
      }

      if (!data.session) {
        console.error('No session returned from login');
        throw new Error('Login failed - no session returned');
      }

      console.log('Login successful, checking session...');
      const success = await checkAndUpdateSession(data.session);

      if (!success) {
        throw new Error('Failed to validate session after login');
      }

      return true;
    } catch (error: any) {
      console.error('Login process error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed. Please try again.',
      }));
      return false;
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Create the Supabase auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name: username,
            avatar_url: null,
            email_verified: false
          }
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('Auth user created successfully with metadata');

        // No need to update metadata separately as it's already set in signUp
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Please check your email to confirm your account before logging in.',
        }));
      }
    } catch (error: any) {
      console.error('Signup process error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Signup failed. Please try again.',
      }));
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthState(prev => ({ ...prev, ...initialState, loading: false }));
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  const checkUserProfile = async (email: string) => {
    try {
      // Check if user exists in auth.users
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      const user = users?.find(u => u.email === email);

      if (!user) {
        return { exists: false, message: 'User not found in auth.users' };
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return {
          exists: true,
          hasProfile: false,
          message: 'User exists but no profile found',
          userId: user.id
        };
      }

      return {
        exists: true,
        hasProfile: true,
        message: 'User and profile found',
        userId: user.id,
        profile
      };
    } catch (error: any) {
      console.error('Error checking user profile:', error);
      return {
        exists: false,
        message: 'Error checking user profile: ' + error.message
      };
    }
  };

  const updateUserMetadata = async (metadata: { username?: string; name?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        throw new Error('Failed to update user information');
      }

      // Update local auth state
      if (authState.user) {
        setAuthState(prev => ({
          ...prev,
          user: {
            ...prev.user!,
            ...metadata
          }
        }));
      }
    } catch (error: any) {
      console.error('Update metadata error:', error);
      throw new Error(error.message || 'Failed to update user information');
    }
  };

  const fetchUserMetadata = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user information');
      }

      if (!user) {
        return null;
      }

      const metadata = user.user_metadata;
      return {
        username: metadata.username || '',
        name: metadata.name || '',
        avatar_url: metadata.avatar_url || null
      };
    } catch (error: any) {
      console.error('Fetch metadata error:', error);
      throw new Error(error.message || 'Failed to fetch user information');
    }
  };

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      logout,
      signup,
      clearError,
      updateUserMetadata,
      fetchUserMetadata,
      checkUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
