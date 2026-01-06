/*import { config } from './config';

// Create Pino logger instance
export const logger = pino({
  level: config.env === 'production' ? 'info' : 'debug',

  // Production: JSON logs (for log aggregation tools)
  // Development: Pretty printed logs
  ...(config.env !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Base properties included in every log
  // base: {
  //   env: config.env,
  // },

  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'otp'],
    remove: true,
  },
});

// Export child loggers for different modules
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
export const apiLogger = logger.child({ module: 'api' });
*/