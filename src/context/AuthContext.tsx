import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { getPersistedUser, loginWithEmail, loginWithGoogleSimulated, logoutUser, persistUser, registerWithEmail } from '@/services/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginGoogle: (name?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersistedUser()
      .then((persisted) => {
        setUser(persisted);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginEmail = async (email: string, pass: string) => {
    const loggedIn = await loginWithEmail(email, pass);
    setUser(loggedIn);
  };

  const registerEmail = async (name: string, email: string, pass: string) => {
    const registered = await registerWithEmail(name, email, pass);
    setUser(registered);
  };

  const loginGoogle = async (name?: string, email?: string) => {
    const loggedIn = await loginWithGoogleSimulated(
      name || 'Blessing',
      email || 'blessing@gmail.com'
    );
    setUser(loggedIn);
  };

  const logout = async () => {
    await logoutUser();
    const guest = await getPersistedUser();
    setUser(guest);
  };

  const updateUserName = async (newName: string) => {
    if (!user) return;
    const updated = { ...user, name: newName };
    await persistUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        updateUserName,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
