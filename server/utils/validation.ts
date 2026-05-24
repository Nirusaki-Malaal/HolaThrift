export const cleanText = (value: unknown, maxLength: number): string => {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export const cleanLongText = (value: unknown, maxLength: number): string => {
  return String(value ?? '').replace(/\r\n/g, '\n').trim().slice(0, maxLength);
};

export const cleanEmail = (value: unknown): string => {
  return cleanText(value, 254).toLowerCase();
};

export const cleanDigits = (value: unknown, maxLength: number): string => {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
};

export const cleanPhone = (value: unknown): string => {
  return cleanDigits(value, 16).slice(-10);
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidObjectId = (value: unknown): boolean => {
  return /^[a-f\d]{24}$/i.test(String(value ?? ''));
};
