import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Express middleware that logs incoming requests with method, url, status, and duration.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Listen for the response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error'
      : statusCode >= 400 ? 'warn'
      : 'info';

    logger[logLevel]('HTTP Request', {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

export default requestLogger;
