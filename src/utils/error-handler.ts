export const getFirebaseErrorMessage = (
  code: string
): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar.';

    case 'auth/invalid-email':
      return 'Format email tidak valid.';

    case 'auth/weak-password':
      return 'Password minimal 6 karakter.';

    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau password salah.';

    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah.';

    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti.';

    default:
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
};
