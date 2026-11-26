/**
 * Centralised error handler for Express routes.
 * Translates domain errors into consistent HTTP responses.
 * Never leaks stack traces or credentials to the client.
 */

import type { Request, Response, NextFunction } from 'express';
import { FlagsmithApiError } from '../../src/flagsmith/client.js';

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

export function handleError(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if ((err as NodeJS.ErrnoException).code === 'NOT_CONFIGURED') {
    res.status(401).json({
      error: 'Orqesta is not connected to Flagsmith.',
      code: 'NOT_CONFIGURED',
      details: 'Go to Settings and enter your Flagsmith API key.',
    } satisfies ApiError);
    return;
  }

  if (err instanceof FlagsmithApiError) {
    const status = err.statusCode === 401 ? 401
      : err.statusCode === 403 ? 403
      : err.statusCode === 404 ? 404
      : err.statusCode === 429 ? 429
      : 502;

    res.status(status).json({
      error: err.message,
      code: `FLAGSMITH_${err.statusCode ?? 'ERROR'}`,
    } satisfies ApiError);
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({
      error: err.message,
      code: 'INTERNAL_ERROR',
    } satisfies ApiError);
    return;
  }

  res.status(500).json({
    error: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  } satisfies ApiError);
}

/** Wraps an async route handler so errors propagate to handleError. */
export function wrap(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
