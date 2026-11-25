import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export const getFirebaseApp = () => getApp();
export const getFirebaseAuth = () => getAuth(getApp());
export const getFirebaseFirestore = () => getFirestore(getApp());

// Backward-compatibility references
export const firebaseApp = getApp();
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
