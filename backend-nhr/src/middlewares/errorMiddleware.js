import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  logger.error(`${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method 
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    // Only include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorMiddleware;
