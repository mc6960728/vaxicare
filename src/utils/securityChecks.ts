/**
 * Security validation utilities to prevent credential leakage and enforce security best practices
 */

import { config } from '../config/config';

/**
 * Validates that all critical environment variables are properly configured
 * Runs at application startup to fail fast if security requirements aren't met
 */
export function validateSecurityConfig(): void {
  const errors: string[] = [];

  // Check JWT Secret strength
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push(
      'JWT_SECRET must be at least 32 characters long. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check for default/weak JWT secrets
  const weakSecrets = [
    'your-secret-key',
    'your-super-secret-jwt-key',
    'change-this',
    'secret',
    '123456',
  ];

  if (weakSecrets.some(weak => config.jwt.secret.toLowerCase().includes(weak))) {
    errors.push(
      'JWT_SECRET appears to be a default/weak value. Please generate a cryptographically secure secret.'
    );
  }

  // Check CORS configuration in production
  // if (config.env === 'production' && config.cors.origin === '*') {
  //   errors.push(
  //     'CORS_ORIGIN must not be "*" in production. Set specific allowed origins (e.g., https://yourdomain.com)'
  //   );
  // }

  // Check database URL doesn't contain obvious passwords
  if (config.database.url) {
    const obviousPasswords = ['password', '123456', 'admin', 'root', 'test'];
    const dbUrl = config.database.url.toLowerCase();

    if (obviousPasswords.some(pass => dbUrl.includes(`:${pass}@`))) {
      errors.push(
        'DATABASE_URL appears to contain a weak password. Use a strong, randomly generated password.'
      );
    }
  }

  // Check that NODE_ENV is set properly
  if (!['development', 'production', 'test'].includes(config.env)) {
    errors.push(
      `NODE_ENV must be 'development', 'production', or 'test'. Current value: ${config.env}`
    );
  }

  // Production-specific checks
  if (config.env === 'production') {
    // Ensure email is enabled in production
    if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') {
      console.warn(
        '[WARNING] Email is disabled in production. Password resets will not work!'
      );
    }

    // Check frontend URL is HTTPS in production
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      errors.push(
        'FRONTEND_URL must use HTTPS in production for security'
      );
    }
  }

  // If there are any errors, throw and prevent application startup
  if (errors.length > 0) {
    console.error('\n[SECURITY] CONFIGURATION ERRORS:\n');
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
    console.error('\n[SECURITY] Application startup blocked due to security issues.\n');

    throw new Error(
      `Security validation failed with ${errors.length} error(s). Fix the issues above and restart.`
    );
  }

  console.log('[SECURITY] Configuration validated successfully');
}

/**
 * Sanitizes error messages to prevent credential leakage in logs
 * Removes sensitive information like database URLs, JWT tokens, etc.
 */
export function sanitizeErrorMessage(error: Error | string): string {
  let message = typeof error === 'string' ? error : error.message;

  // Remove database connection strings
  message = message.replace(
    /postgresql:\/\/[^@]+@[^\s]+/gi,
    'postgresql://[REDACTED]@[REDACTED]'
  );

  // Remove JWT tokens (long alphanumeric strings that look like tokens)
  message = message.replace(
    /[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,
    '[JWT_TOKEN_REDACTED]'
  );

  // Remove email passwords
  message = message.replace(
    /EMAIL_PASSWORD[=:]\s*[^\s]+/gi,
    'EMAIL_PASSWORD=[REDACTED]'
  );

  // Remove authorization headers
  message = message.replace(
    /authorization[=:]\s*bearer\s+[^\s]+/gi,
    'authorization: Bearer [REDACTED]'
  );

  // Remove API keys (common patterns)
  message = message.replace(
    /[a-zA-Z0-9_-]*(?:api[_-]?key|secret|token|password)[a-zA-Z0-9_-]*[=:]\s*[^\s]+/gi,
    (match) => {
      const key = match.split(/[=:]/)[0];
      return `${key}=[REDACTED]`;
    }
  );

  return message;
}

/**
 * Checks if a string contains potential sensitive data
 * Useful for preventing sensitive data from being logged or returned in responses
 */
export function containsSensitiveData(text: string): boolean {
  const sensitivePatterns = [
    /postgresql:\/\//i,
    /mysql:\/\//i,
    /mongodb:\/\//i,
    /password[=:]/i,
    /secret[=:]/i,
    /api[_-]?key[=:]/i,
    /bearer\s+[a-zA-Z0-9_-]+/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * Redacts sensitive fields from objects before logging
 * Useful for logging request/response objects
 */
export function redactSensitiveFields<T extends Record<string, any>>(
  obj: T,
  sensitiveKeys: string[] = ['password', 'secret', 'token', 'authorization', 'apiKey']
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redacted = { ...obj };

  for (const key in redacted) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      redacted[key] = '[REDACTED]' as any;
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveFields(redacted[key], sensitiveKeys) as any;
    }
  }

  return redacted;
}
