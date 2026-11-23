export const getFirebaseErrorMessage = (errorOrCode: any): string => {
  const rawCode =
    typeof errorOrCode === 'string' ? errorOrCode : errorOrCode?.code || '';
  const message =
    typeof errorOrCode?.message === 'string' ? errorOrCode.message : '';
  // Some SDK errors only carry `[firestore/permission-denied] …` in the message.
  const bracketCode = /^\[([^\]]+)\]/.exec(message)?.[1] ?? '';

  // React Native Firebase prefixes codes (`firestore/…`, `auth/…`), while the
  // modular/JS SDK sometimes returns them bare. Normalise both.
  const code = String(rawCode || bracketCode).replace(/^(firestore|auth)\//, '');

  switch (code) {
    case 'email-already-in-use':
      return 'Email sudah terdaftar. Silakan gunakan email lain atau login.';

    case 'invalid-email':
      return 'Format email tidak valid.';

    case 'weak-password':
      return 'Password terlalu lemah. Minimal 6 karakter.';

    case 'invalid-credential':
    case 'wrong-password':
    case 'user-not-found':
      return 'Email atau password yang Anda masukkan salah.';

    case 'user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';

    case 'network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';

    case 'too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';

    case 'permission-denied':
      return 'Anda tidak memiliki izin untuk mengakses data. Hubungi asisten/admin untuk memeriksa Firestore Rules.';

    case 'unavailable':
      return 'Layanan basis data sedang tidak dapat diakses (offline).';

    default:
      if (message) return message;
      return 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.';
  }
};
