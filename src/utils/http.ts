export const readJson = async <T = unknown>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    const fallback = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(fallback || `Request failed with status ${response.status}`);
  }
};

export const getResponseError = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (message) return String(message);
  }
  return fallback;
};
