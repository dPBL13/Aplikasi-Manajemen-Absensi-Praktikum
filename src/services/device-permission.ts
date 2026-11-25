// sprint 3

import { Linking } from 'react-native';

import { notificationService } from '@/services/notification';

let Camera: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cameraPkg = require('expo-camera');
  Camera = cameraPkg.Camera || cameraPkg.CameraView || cameraPkg;
} catch {
  // Expo Go fallback
}

let Location: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Location = require('expo-location');
} catch {
  // Expo Go fallback
}

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // Expo Go fallback
}

export type PermissionKind = 'location' | 'notification' | 'camera';
/** blocked = pengguna menolak dan OS tidak mau bertanya lagi (canAskAgain false). */
export type PermissionState = 'granted' | 'denied' | 'blocked' | 'undetermined';

export interface DevicePermissionService {
  getStatus(kind: PermissionKind): Promise<PermissionState>;
  request(kind: PermissionKind): Promise<PermissionState>;
  requestLocation(): Promise<PermissionState>;
  requestNotification(): Promise<PermissionState>;
  requestCamera(): Promise<PermissionState>;
  isLocationServiceEnabled(): Promise<boolean>;
  openSettings(): Promise<void>;
}

/** Batas tunggu sinyal GPS (FR-33 butir 4). Dipakai useUserLocation (JH-05). */
export const GPS_TIMEOUT_MS = 10_000;
/** Jeda cek GPS saat layar fokus. Dijaga >= 3 dtk demi efisiensi daya (NFR). */
export const GPS_POLL_INTERVAL_MS = 3_000;

/** Teks wajib (SRS FR-33 + Design §7.2). Dipakai bersama oleh dialog/banner. */
export const PERMISSION_COPY = {
  location: {
    title: 'Akses Lokasi Diperlukan untuk Presensi',
    message:
      'Untuk memastikan kejujuran presensi praktikum di laboratorium Informatika Undip, kami memerlukan izin akses lokasi perangkat Anda saat menggunakan aplikasi.',
    allowLabel: 'Izinkan Akses Lokasi',
    deniedTitle: 'Izin Lokasi Dibutuhkan untuk Melakukan Presensi',
    deniedMessage:
      'Aktifkan izin lokasi di pengaturan perangkat agar presensi dapat diverifikasi.',
  },
  notification: {
    title: 'Aktifkan Notifikasi Sesi Praktikum',
    message:
      'Notifikasi dipakai untuk memberi tahu Anda saat sesi dibuka, jadwal berubah, atau pengajuan izin diputuskan.',
    allowLabel: 'Izinkan Notifikasi',
    deniedTitle: 'Izin Notifikasi Dibutuhkan agar Tidak Ketinggalan Sesi',
    deniedMessage: 'Aktifkan izin notifikasi di pengaturan perangkat.',
  },
  camera: {
    title: 'Akses Kamera Diperlukan',
    message: 'Kamera dipakai untuk memindai QR Code presensi.',
    allowLabel: 'Izinkan Akses Kamera',
    deniedTitle: 'Izin Kamera Dibutuhkan untuk Memindai QR Code',
    deniedMessage: 'Aktifkan izin kamera di pengaturan perangkat.',
  },
} as const;

export const GPS_DISABLED_COPY = {
  title: 'Aktifkan GPS perangkat Anda untuk melanjutkan',
  message:
    'Layanan lokasi (GPS) pada perangkat sedang nonaktif. Aktifkan GPS, lalu kembali ke aplikasi.',
  openSettingsLabel: 'Buka Pengaturan Perangkat',
} as const;

type RawPermission = { status: string; granted: boolean; canAskAgain: boolean };

/** Fungsi murni: dipisah agar mudah diuji (YG-08). */
export function mapPermissionResponse(raw: RawPermission): PermissionState {
  if (raw.granted || raw.status === 'granted') return 'granted';
  if (raw.status === 'undetermined') return 'undetermined';
  return raw.canAskAgain ? 'denied' : 'blocked';
}

async function readRaw(kind: PermissionKind, ask: boolean): Promise<RawPermission> {
  switch (kind) {
    case 'location':
      if (!Location?.getForegroundPermissionsAsync) {
        return { status: 'granted', granted: true, canAskAgain: true };
      }
      return ask
        ? Location.requestForegroundPermissionsAsync()
        : Location.getForegroundPermissionsAsync();
    case 'notification':
      // Android 13+: kanal harus ada dulu, kalau tidak dialog izin tidak muncul.
      if (ask) await notificationService.initialize();
      if (!Notifications?.getPermissionsAsync) {
        return { status: 'granted', granted: true, canAskAgain: true };
      }
      return ask ? Notifications.requestPermissionsAsync() : Notifications.getPermissionsAsync();
    case 'camera':
      if (!Camera?.getCameraPermissionsAsync && !Camera?.requestCameraPermissionsAsync) {
        return { status: 'granted', granted: true, canAskAgain: true };
      }
      return ask ? Camera.requestCameraPermissionsAsync() : Camera.getCameraPermissionsAsync();
  }
}

async function getStatus(kind: PermissionKind): Promise<PermissionState> {
  try {
    return mapPermissionResponse(await readRaw(kind, false));
  } catch {
    return 'undetermined';
  }
}

async function request(kind: PermissionKind): Promise<PermissionState> {
  try {
    return mapPermissionResponse(await readRaw(kind, true));
  } catch {
    return 'denied';
  }
}

export const devicePermissionService: DevicePermissionService = {
  getStatus,
  request,
  requestLocation: () => request('location'),
  requestNotification: () => request('notification'),
  requestCamera: () => request('camera'),
  async isLocationServiceEnabled() {
    try {
      if (!Location?.hasServicesEnabledAsync) return true;
      return await Location.hasServicesEnabledAsync();
    } catch {
      return false;
    }
  },
  async openSettings() {
    try {
      await Linking.openSettings();
    } catch {
      // Tidak ada yang bisa dilakukan; pengguna dapat membuka Pengaturan manual.
    }
  },
};