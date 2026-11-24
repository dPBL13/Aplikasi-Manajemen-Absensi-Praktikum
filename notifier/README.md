# Notifier Relay (Local Node.js Firestore to FCM Dispatcher)

Relay lokal untuk memantau perubahan dokumen pada Cloud Firestore (Spark Tier / Gratis) dan mengirim notifikasi push FCM ke perangkat praktikan melalui Firebase Admin SDK.

## Prasyarat
1. File service account private key dari Firebase Console (`Project Settings` -> `Service accounts` -> `Generate new private key`).
2. Simpan file tersebut di folder ini dengan nama:
   `serviceAccountKey.json`
   *(File ini sudah masuk `.gitignore` agar aman dan tidak bocor ke repo git).*

## Menjalankan Relay
```bash
cd notifier
npm install
node index.js
```

## Cara Kerja
1. Snapshot pertama menginisialisasi memory cache tanpa mengirim notifikasi (mencegah notifikasi berulang / spam saat relay baru dijalankan).
2. Memantau event perubahan status sesi praktikum menjadi `'berlangsung'` (Sesi Dibuka / FR-32).
3. Memantau perubahan jadwal sesi (Jadwal Diubah / FR-32).
4. Memantau perubahan status pengajuan izin menjadi `'diterima'` atau `'ditolak'` (Status Izin / FR-32, BR-08).
5. Token FCM yang invalid/kedaluwarsa otomatis dibersihkan dari subkoleksi `fcmTokens`.
