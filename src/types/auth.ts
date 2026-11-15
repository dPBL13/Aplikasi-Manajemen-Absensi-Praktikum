import type { User } from '@react-native-firebase/auth';

export type UserRole = 'asprak' | 'praktikan';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  nim: string;
  role: UserRole;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  nim: string;
  role: UserRole;
  asprakToken?: string;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (emailOrNim: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  register: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; reason: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
