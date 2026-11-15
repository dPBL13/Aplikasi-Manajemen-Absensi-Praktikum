import {
    createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';

import {
    doc,
    serverTimestamp,
    setDoc,
} from '@react-native-firebase/firestore';

import { firebaseAuth, firestore } from './firebase/config';

export async function registerUser(
  name: string,
  email: string,
  password: string,
  nim: string,
  role: 'praktikan' | 'asprak'
) {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password
  );

  const uid = credential.user.uid;

  await setDoc(doc(firestore, 'users', uid), {
    uid,
    name,
    email,
    nim,
    role,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}
