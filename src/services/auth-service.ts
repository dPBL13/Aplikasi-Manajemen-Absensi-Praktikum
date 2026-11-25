import {
  createUserWithEmailAndPassword,
  getIdToken,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@react-native-firebase/auth';
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';

import type { RegisterInput, UserProfile } from '@/types/auth';
import { getFirebaseErrorMessage } from '@/utils/error-handler';
import { validateRegistrationInput } from '@/utils/validation';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase/config';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(getFirebaseFirestore(), 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('[auth-service] Gagal mengambil profil user:', error);
    return null;
  }
}

/**
 * Menyimpan profil ke Firestore dengan beberapa kali percobaan.
 * Setelah `createUserWithEmailAndPassword`, token Auth kadang belum
 * terpropagasi ke Firestore sehingga write pertama ditolak. Retry singkat
 * membuat profil tetap tersimpan dan mencegah akun "lokal saja".
 */
async function saveProfileWithRetry(
  uid: string,
  profile: UserProfile,
  attempts = 3
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await setDoc(doc(getFirebaseFirestore(), 'users', uid), profile, { merge: true });
      return;
    } catch (error) {
      lastError = error;
      console.warn(`[auth-service] Gagal menyimpan profil (percobaan ${attempt + 1}):`, error);
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function registerUser(
  input: RegisterInput
): Promise<{ ok: true; profile: UserProfile } | { ok: false; reason: string }> {
  const errors = validateRegistrationInput(input);
  const firstError = Object.values(errors)[0];
  if (firstError) {
    return { ok: false, reason: firstError };
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      input.email.trim(),
      input.password
    );

    const uid = cred.user.uid;

    // Pastikan token Auth sudah aktif sebelum menulis ke Firestore, dan simpan
    // nama di Auth agar profil bisa dipulihkan bila dokumen Firestore hilang.
    await updateProfile(cred.user, { displayName: input.name.trim() }).catch(() => undefined);
    await getIdToken(cred.user, true).catch(() => undefined);

    const profile: UserProfile = {
      uid,
      name: input.name.trim(),
      email: input.email.trim(),
      nim: input.nim.trim(),
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    await saveProfileWithRetry(uid, profile);
    return { ok: true, profile };
  } catch (error: any) {
    return { ok: false, reason: getFirebaseErrorMessage(error) };
  }
}

export async function loginUser(
  emailOrNim: string,
  password: string
): Promise<{ ok: true; profile: UserProfile } | { ok: false; reason: string }> {
  try {
    const targetEmail = emailOrNim.trim();

    // Firestore rules require authentication to read the users collection, so
    // NIM -> email lookup cannot run before sign-in. Require the registered email
    // instead of failing deep inside the SDK with a raw permission-denied error.
    if (/^\d+$/.test(targetEmail)) {
      return {
        ok: false,
        reason:
          'Login dengan NIM belum tersedia. Masukkan email yang Anda gunakan saat mendaftar.',
      };
    }

    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), targetEmail, password);
    const profile = await getUserProfile(cred.user.uid);

    if (!profile) {
      // Fallback profil jika dokumen belum ada
      const fallbackProfile: UserProfile = {
        uid: cred.user.uid,
        name: cred.user.displayName || 'Pengguna',
        email: cred.user.email || targetEmail,
        nim: '',
        role: 'praktikan',
        createdAt: new Date().toISOString(),
      };
      return { ok: true, profile: fallbackProfile };
    }

    return { ok: true, profile };
  } catch (error: any) {
    return { ok: false, reason: getFirebaseErrorMessage(error) };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch (error) {
    console.warn('[auth-service] Gagal logout:', error);
  }
}
