import type { ErrorRequestHandler } from 'express';

const getStatusCode = (error: unknown): number => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    if (Number.isInteger(status) && status >= 400 && status < 600) return status;
  }
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const status = Number((error as { statusCode?: unknown }).statusCode);
    if (Number.isInteger(status) && status >= 400 && status < 600) return status;
  }
  return 500;
};

const getMessage = (statusCode: number): string => {
  if (statusCode === 400) return 'Invalid request body';
  if (statusCode === 413) return 'Request body is too large';
  return 'Internal server error';
};

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = getStatusCode(error);
  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json({ error: getMessage(statusCode) });
};
