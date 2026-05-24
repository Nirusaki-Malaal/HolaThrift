const fallbackAdminEmails = ['nirusaki3@gmail.com', 'nirusakimalaal@gmail.com'];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseAdminEmails = (value?: string): string[] => {
  if (!value) return [];
  return value.replace(/"/g, '').split(',').map(normalizeEmail).filter(Boolean);
};

const configuredAdminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

export const adminEmails = configuredAdminEmails.length > 0 ? configuredAdminEmails : fallbackAdminEmails;

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return adminEmails.includes(normalizeEmail(email));
};
