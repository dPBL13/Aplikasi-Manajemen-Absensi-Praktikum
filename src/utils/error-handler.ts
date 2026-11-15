export const getFirebaseErrorMessage = (errorOrCode: any): string => {
  const code =
    typeof errorOrCode === 'string'
      ? errorOrCode
      : errorOrCode?.code || errorOrCode?.message || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan gunakan email lain atau login.';

    case 'auth/invalid-email':
      return 'Format email tidak valid.';

    case 'auth/weak-password':
      return 'Password terlalu lemah. Minimal 6 karakter.';

    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password yang Anda masukkan salah.';

    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';

    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';

    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';

    case 'permission-denied':
      return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';

    case 'unavailable':
      return 'Layanan basis data sedang tidak dapat diakses (offline).';

    default:
      if (typeof errorOrCode?.message === 'string' && errorOrCode.message) {
        return errorOrCode.message;
      }
      return 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.';
  }
};
