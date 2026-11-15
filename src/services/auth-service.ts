import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';

import type { RegisterInput, UserProfile } from '@/types/auth';
import { getFirebaseErrorMessage } from '@/utils/error-handler';
import { validateRegistrationInput } from '@/utils/validation';
import { firebaseAuth, firestore } from './firebase/config';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(firestore, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('[auth-service] Gagal mengambil profil user:', error);
    return null;
  }
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
      firebaseAuth,
      input.email.trim(),
      input.password
    );

    const uid = cred.user.uid;
    const profile: UserProfile = {
      uid,
      name: input.name.trim(),
      email: input.email.trim(),
      nim: input.nim.trim(),
      role: input.role,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, 'users', uid), profile);
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
    let targetEmail = emailOrNim.trim();

    // Jika pengguna memasukkan NIM (14 digit) alih-alih email, cari email-nya di Firestore
    if (/^\d{14}$/.test(targetEmail)) {
      const q = query(
        collection(firestore, 'users'),
        where('nim', '==', targetEmail)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const userData = querySnap.docs[0].data() as UserProfile;
        targetEmail = userData.email;
      }
    }

    const cred = await signInWithEmailAndPassword(firebaseAuth, targetEmail, password);
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
    await signOut(firebaseAuth);
  } catch (error) {
    console.warn('[auth-service] Gagal logout:', error);
  }
}
