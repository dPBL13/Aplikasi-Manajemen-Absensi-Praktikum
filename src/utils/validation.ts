export const validateNIM = (nim: string): boolean => {
  return /^\d{14}$/.test(nim);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (
  password: string
): boolean => {
  return password.length >= 6;
};

export const validateAsprakToken = (
  token: string,
  secret: string
): boolean => {
  return token === secret;
};
