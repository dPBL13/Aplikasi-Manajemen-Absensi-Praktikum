const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Fungsi murni yang sama dengan yang diuji (hanya `import type`, aman di Node via tsx).
const {
  detectSessionOpened,
  buildSessionOpenedPayload,
  resolveSessionRecipientNims,
} = require('../src/services/triggers/session-triggers');
const {
  detectScheduleChanged,
  buildScheduleChangedPayload,
  detectPermitDecision,
  buildPermitDecisionPayload,
} = require('../src/services/triggers/schedule-permit-triggers');

const keyPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('[ERROR] serviceAccountKey.json tidak ditemukan di folder notifier/');
  console.error('Unduh dari Firebase Console -> Project Settings -> Service accounts -> Generate new private key');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();
const messaging = admin.messaging();

const CHANNEL_ID = 'sesi-praktikum';
const sessionCache = new Map();
const permitCache = new Map();
let sessionsReady = false;
let permitsReady = false;

// Pengiriman berurutan agar urutan notifikasi sama dengan urutan perubahan data.
let queue = Promise.resolve();
const enqueue = (job) => {
  queue = queue.then(job).catch((error) => console.error('[RELAY] Job gagal:', error));
};

/** Cari token FCM berdasarkan NIM (BR-07/BR-08); token yang sama hanya dikirim sekali. */
async function getTokensByNims(nims) {
  const unique = [...new Set((nims || []).filter(Boolean))];
  const byToken = new Map();

  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30); // batas operator `in` Firestore
    const users = await db.collection('users').where('nim', 'in', chunk).get();
    const lists = await Promise.all(users.docs.map((u) => u.ref.collection('fcmTokens').get()));
    for (const snap of lists) {
      snap.forEach((doc) => {
        const data = doc.data();
        if (data && data.token && !byToken.has(data.token)) {
          byToken.set(data.token, { token: data.token, ref: doc.ref });
        }
      });
    }
  }
  return [...byToken.values()];
}

/** FCM `data` wajib string datar; kunci kosong dibuang. */
function toFcmData(data) {
  const out = { type: data.type, screen: data.screen };
  if (data.sessionId) out.sessionId = data.sessionId;
  if (data.permitId) out.permitId = data.permitId;
  if (data.params) out.params = JSON.stringify(data.params);
  return out;
}

async function send(targets, payload) {
  if (targets.length === 0) {
    console.log(`[FCM] ${payload.data.type}: tidak ada token tujuan.`);
    return;
  }
  const response = await messaging.sendEachForMulticast({
    tokens: targets.map((t) => t.token),
    notification: { title: payload.title, body: payload.body },
    data: toFcmData(payload.data),
    android: {
      priority: 'high',
      notification: { channelId: CHANNEL_ID, defaultVibrateTimings: true },
    },
  });
  console.log(`[FCM] ${payload.data.type}: sukses ${response.successCount}, gagal ${response.failureCount}`);

  response.responses.forEach((res, index) => {
    const code = res.error && res.error.code;
    if (
      !res.success &&
      (code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token')
    ) {
      targets[index].ref.delete().catch(() => {});
      console.log('[FCM] Token tidak valid dihapus.');
    }
  });
}

const dispatch = async (nims, payload) => send(await getTokensByNims(nims), payload);

function handleSessionChange(change) {
  const id = change.doc.id;
  if (change.type === 'removed') {
    sessionCache.delete(id);
    return;
  }
  const next = { ...change.doc.data(), id };
  const prev = sessionCache.get(id);
  sessionCache.set(id, next); // perbarui SEBELUM kerja async: mencegah notifikasi ganda

  if (change.type !== 'modified' || !prev) return;

  const payloads = [];
  if (detectSessionOpened(prev, next)) payloads.push(buildSessionOpenedPayload(next));
  if (detectScheduleChanged(prev, next)) payloads.push(buildScheduleChangedPayload(next));
  if (payloads.length === 0) return;

  const nims = resolveSessionRecipientNims(next);
  for (const payload of payloads) {
    console.log(`[TRIGGER] ${payload.data.type}: ${next.courseName} (${id})`);
    enqueue(() => dispatch(nims, payload));
  }
}

function handlePermitChange(change) {
  const id = change.doc.id;
  if (change.type === 'removed') {
    permitCache.delete(id);
    return;
  }
  const next = { ...change.doc.data(), id };
  const prev = permitCache.get(id);
  permitCache.set(id, next);

  if (change.type !== 'modified' || !prev || !next.nim) return;
  if (!detectPermitDecision(prev, next)) return;

  console.log(`[TRIGGER] PERMIT_DECISION ${next.status}: NIM ${next.nim}`);
  enqueue(() => dispatch([next.nim], buildPermitDecisionPayload(next)));
}

// Snapshot pertama hanya mengisi cache (tidak mengirim apa pun).
db.collection('sessions').onSnapshot(
  (snapshot) => {
    if (!sessionsReady) {
      snapshot.forEach((doc) => sessionCache.set(doc.id, { ...doc.data(), id: doc.id }));
      sessionsReady = true;
      console.log(`[RELAY] Cache awal sesi: ${sessionCache.size}`);
      return;
    }
    snapshot.docChanges().forEach(handleSessionChange);
  },
  (error) => console.error('[RELAY] Listener sessions error:', error),
);

db.collection('permits').onSnapshot(
  (snapshot) => {
    if (!permitsReady) {
      snapshot.forEach((doc) => permitCache.set(doc.id, { ...doc.data(), id: doc.id }));
      permitsReady = true;
      console.log(`[RELAY] Cache awal izin: ${permitCache.size}`);
      return;
    }
    snapshot.docChanges().forEach(handlePermitChange);
  },
  (error) => console.error('[RELAY] Listener permits error:', error),
);

console.log('[SIPRAK NOTIFIER RELAY] Siap. Memantau Firestore...');