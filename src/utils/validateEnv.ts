import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number).default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/, 'BCRYPT_SALT_ROUNDS must be a number').transform(Number).default('10'),
});

export function validateEnv(): void {
  try {
    envSchema.parse(process.env);

    console.log('[ENV] Environment variables validated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[ENV] Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n[HINT] Please check your .env file and ensure all required variables are set correctly.');
      process.exit(1);
    }
    throw error;
  }
}
