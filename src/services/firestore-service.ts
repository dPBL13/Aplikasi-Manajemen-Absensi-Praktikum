import {
    collection,
    onSnapshot,
} from '@react-native-firebase/firestore';

import { firestore } from './firebase/config';

export function subscribeSessions(
  callback: (sessions: Session[]) => void
) {
  return onSnapshot(
    collection(firestore, 'sessions'),
    (snapshot) => {
      const sessions = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Session[];

      callback(sessions);
    }
  );
}
