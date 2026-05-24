const defaultTimeoutMs = Number(process.env.EXTERNAL_FETCH_TIMEOUT_MS || 15000);

export const sanitizeResponseText = (text: string): string => {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
};

export const fetchWithTimeout = async (input: string, init: RequestInit = {}, timeoutMs = defaultTimeoutMs): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: init.signal || controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`External service request timed out after ${timeoutMs}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const readExternalText = async (response: Response): Promise<string> => {
  const text = await response.text();
  return sanitizeResponseText(text);
};

export const readExternalJson = async <T = unknown>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(sanitizeResponseText(text) || `Invalid JSON response from external service (${response.status})`);
  }
};
