const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseAdminEmails = (value?: string): string[] => {
  if (!value) return [];
  return value.replace(/"/g, '').split(',').map(normalizeEmail).filter(Boolean);
};

export const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return adminEmails.includes(normalizeEmail(email));
};
