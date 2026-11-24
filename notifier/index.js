const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('\x1b[31m[ERROR]\x1b[0m serviceAccountKey.json tidak ditemukan di folder notifier/');
  console.error('Silakan unduh dari Firebase Console -> Project Settings -> Service accounts -> Generate new private key');
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

console.log('\x1b[32m[SIPRAK NOTIFIER RELAY]\x1b[0m Service initialized. Listening to Firestore changes...');

let initialSessionsLoaded = false;
let initialPermitsLoaded = false;
const sessionCache = new Map();
const permitCache = new Map();

/**
 * Mengirim pesan FCM multicast ke token list dan menghapus token yang kedaluwarsa/invalid.
 */
async function sendNotificationToTokens(tokensWithDocRef, payload) {
  if (!tokensWithDocRef || tokensWithDocRef.length === 0) return;

  const registrationTokens = tokensWithDocRef.map((t) => t.token);

  const message = {
    tokens: registrationTokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      type: payload.data.type,
      screen: payload.data.screen,
      sessionId: payload.data.sessionId || '',
      permitId: payload.data.permitId || '',
      params: JSON.stringify(payload.data.params || {}),
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'sesi-praktikum',
        defaultVibrateTimings: true,
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`[FCM] Sent to ${registrationTokens.length} devices. Success: ${response.successCount}, Failure: ${response.failureCount}`);

    // Bersihkan token invalid
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token'
          ) {
            const invalidRef = tokensWithDocRef[idx].ref;
            invalidRef.delete().catch(() => {});
            console.log(`[FCM Cleanup] Removed invalid token: ${tokensWithDocRef[idx].token}`);
          }
        }
      });
    }
  } catch (error) {
    console.error('[FCM Error]', error);
  }
}

/**
 * Mencari semua token FCM milik pengguna berdasarkan daftar NIM (BR-07, BR-08).
 */
async function getTokensByNims(nims) {
  if (!nims || nims.length === 0) return [];

  const tokens = [];
  const chunkSize = 30; // Firestore IN query limit

  for (let i = 0; i < nims.length; i += chunkSize) {
    const chunk = nims.slice(i, i + chunkSize);
    const usersSnapshot = await db.collection('users').where('nim', 'in', chunk).get();

    for (const userDoc of usersSnapshot.docs) {
      const tokensSnap = await userDoc.ref.collection('fcmTokens').get();
      tokensSnap.forEach((tDoc) => {
        const data = tDoc.data();
        if (data && data.token) {
          tokens.push({
            token: data.token,
            ref: tDoc.ref,
          });
        }
      });
    }
  }

  return tokens;
}

// 1. Pantau Koleksi Sessions
db.collection('sessions').onSnapshot((snapshot) => {
  if (!initialSessionsLoaded) {
    snapshot.forEach((doc) => {
      sessionCache.set(doc.id, doc.data());
    });
    initialSessionsLoaded = true;
    console.log(`[RELAY] Initial sessions cached (${sessionCache.size} documents).`);
    return;
  }

  snapshot.docChanges().forEach(async (change) => {
    const docId = change.doc.id;
    const next = change.doc.data();
    const prev = sessionCache.get(docId);

    if (change.type === 'modified') {
      // Cek Trigger Sesi Dibuka (FR-32)
      if (prev && prev.status !== 'berlangsung' && next.status === 'berlangsung') {
        console.log(`[TRIGGER] Sesi Dibuka: ${next.courseName} (${docId})`);
        const nims = (next.participants || []).map((p) => p.nim).filter(Boolean);
        const tokens = await getTokensByNims(nims);

        const payload = {
          title: 'SIPRAK Informatika Undip',
          body: `Sesi Praktikum Telah Dibuka: ${next.courseName} (${next.classGroup || ''}). Segera lakukan presensi di ${next.room || ''}!`,
          data: {
            type: 'SESSION_OPENED',
            sessionId: docId,
            screen: `/praktikan/session/${docId}`,
            params: { sessionId: docId, courseName: next.courseName },
          },
        };
        await sendNotificationToTokens(tokens, payload);
      }

      // Cek Trigger Jadwal Berubah (FR-32)
      if (
        prev &&
        (prev.dayLabel !== next.dayLabel ||
          prev.dateLabel !== next.dateLabel ||
          prev.startTime !== next.startTime ||
          prev.endTime !== next.endTime ||
          prev.room !== next.room)
      ) {
        console.log(`[TRIGGER] Jadwal Berubah: ${next.courseName} (${docId})`);
        const nims = (next.participants || []).map((p) => p.nim).filter(Boolean);
        const tokens = await getTokensByNims(nims);

        const payload = {
          title: 'SIPRAK Informatika Undip',
          body: `Pemberitahuan: Jadwal praktikum ${next.courseName} mengalami perubahan`,
          data: {
            type: 'SCHEDULE_CHANGED',
            sessionId: docId,
            screen: `/praktikan/session/${docId}`,
            params: { sessionId: docId, courseName: next.courseName },
          },
        };
        await sendNotificationToTokens(tokens, payload);
      }
    }

    sessionCache.set(docId, next);
  });
});

// 2. Pantau Koleksi Permits
db.collection('permits').onSnapshot((snapshot) => {
  if (!initialPermitsLoaded) {
    snapshot.forEach((doc) => {
      permitCache.set(doc.id, doc.data());
    });
    initialPermitsLoaded = true;
    console.log(`[RELAY] Initial permits cached (${permitCache.size} documents).`);
    return;
  }

  snapshot.docChanges().forEach(async (change) => {
    const docId = change.doc.id;
    const next = change.doc.data();
    const prev = permitCache.get(docId);

    if (change.type === 'modified') {
      // Cek Trigger Keputusan Izin (FR-32, BR-08)
      if (prev && prev.status === 'menunggu' && (next.status === 'diterima' || next.status === 'ditolak')) {
        console.log(`[TRIGGER] Status Izin ${next.status}: ${next.courseName} untuk NIM ${next.nim}`);
        if (next.nim) {
          const tokens = await getTokensByNims([next.nim]);
          const statusLabel = next.status === 'diterima' ? 'Diterima' : 'Ditolak';

          const payload = {
            title: 'SIPRAK Informatika Undip',
            body: `Status Izin: Pengajuan izin Anda untuk sesi ${next.courseName || ''} telah ${statusLabel}`,
            data: {
              type: 'PERMIT_DECISION',
              permitId: docId,
              sessionId: next.sessionId || '',
              screen: '/praktikan/riwayat',
              params: { permitId: docId, status: next.status },
            },
          };
          await sendNotificationToTokens(tokens, payload);
        }
      }
    }

    permitCache.set(docId, next);
  });
});
