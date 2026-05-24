export const getEnv = (key: string): string => {
  return (process.env[key] || '').replace(/"/g, '').trim();
};

export const getRequiredEnv = (key: string): string => {
  const value = getEnv(key);
  if (!value) throw new Error(`${key} is required`);
  return value;
};
