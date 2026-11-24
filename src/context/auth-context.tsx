import { onAuthStateChanged, type User } from '@react-native-firebase/auth';
import React, { createContext, useEffect, useState } from 'react';

import { getUserProfile, loginUser, logoutUser, registerUser } from '@/services/auth-service';
import { unregisterDeviceToken } from '@/services/fcm-token-sync';
import { getFirebaseAuth } from '@/services/firebase/config';
import type { AuthContextType, RegisterInput, UserProfile, UserRole } from '@/types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const login = async (emailOrNim: string, password: string) => {
    const res = await loginUser(emailOrNim, password);
    if (res.ok) {
      setUserProfile(res.profile);
      return { ok: true as const };
    }
    return { ok: false as const, reason: res.reason };
  };

  const register = async (input: RegisterInput) => {
    const res = await registerUser(input);
    if (res.ok) {
      setUserProfile(res.profile);
      return { ok: true as const };
    }
    return { ok: false as const, reason: res.reason };
  };

  const logout = async () => {
    if (user?.uid) {
      await unregisterDeviceToken(user.uid);
    }
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  };

  const role: UserRole | null = userProfile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
