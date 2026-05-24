import type { Request, Response } from 'express';

export const apiNotFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
  });
};
