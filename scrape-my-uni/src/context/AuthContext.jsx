import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  async function signup(email, password, name) {
    try {
      setError(null);
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (authError) throw authError;

      // The trigger handle_new_user auto-creates the users row
      // But we need to update display_name if set
      if (data.user && name) {
        await supabase
          .from('users')
          .update({ display_name: name })
          .eq('id', data.user.id);
      }

      // AUTO-ADMIN: If no admins exist yet, make this user admin
      if (data.user) {
        try {
          const { count } = await supabase
            .from('admins')
            .select('id', { count: 'exact', head: true });
          if (count === 0) {
            await supabase.from('admins').insert({
              user_id: data.user.id,
              email: data.user.email.toLowerCase(),
              name: name || 'Admin',
            });
            await supabase.from('users').update({ role: 'admin' }).eq('id', data.user.id);
            console.log('🎉 First user auto-promoted to admin!');
          }
        } catch (e) {
          console.warn('Auto-admin check failed:', e);
        }
      }

      return data.user;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      // Update last login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    try {
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
      return data;
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Logout
  async function logout() {
    try {
      setError(null);
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      setError(null);
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (authError) throw authError;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Update user's profile
  async function updateUserProfile(displayName, photoURL) {
    try {
      setError(null);
      if (!currentUser) throw new Error('No user is signed in');

      // Update auth metadata
      const updates = {};
      if (displayName) updates.display_name = displayName;
      if (photoURL) updates.photo_url = photoURL;

      await supabase.auth.updateUser({
        data: { display_name: displayName, avatar_url: photoURL },
      });

      // Update users table
      await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Update user's email
  async function updateUserEmail(email) {
    try {
      setError(null);
      if (!currentUser) throw new Error('No user is signed in');
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) throw authError;
    } catch (err) {
      console.error('Email update error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Update user's password
  async function updateUserPassword(password) {
    try {
      setError(null);
      if (!currentUser) throw new Error('No user is signed in');
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message);
      throw err;
    }
  }

  // Verify admin status
  async function verifyAdminStatus() {
    try {
      setError(null);
      if (!currentUser) throw new Error('No user is signed in');

      // Check admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', currentUser.email.toLowerCase())
        .maybeSingle();

      if (adminError) {
        console.error('Admin check error:', adminError);
        return false;
      }

      const isInAdminsCollection = !!adminData;

      // Check user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      const isAdminInUserDoc = userData?.role === 'admin';

      // Fix inconsistencies
      if (isAdminInUserDoc && !isInAdminsCollection) {
        await supabase.from('admins').insert({
          user_id: currentUser.id,
          email: currentUser.email.toLowerCase(),
          name: currentUser.user_metadata?.display_name || 'Admin User',
        });
      } else if (!isAdminInUserDoc && isInAdminsCollection) {
        await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', currentUser.id);
      }

      return isAdminInUserDoc || isInAdminsCollection;
    } catch (err) {
      console.error('Admin verification error:', err);
      setError(err.message);
      return false;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setCurrentUser(session?.user ?? null);

        // Update last login on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    error,
    loading,
    isAuthenticated: !!currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    verifyAdminStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
