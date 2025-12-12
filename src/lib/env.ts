/**
 * Environment variable validation using Zod
 * Ensures all required env vars are present and valid
 */

import { z } from 'zod';

const envSchema = z.object({
  // Firebase configuration (optional - app works without it)
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_DATABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at runtime
 * Non-blocking - logs warnings but allows app to continue
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[Env] Environment validation warnings:', error.errors);
      console.warn('[Env] App will continue with default/fallback values');
    }
    // Return import.meta.env as-is if validation fails
    return import.meta.env as Env;
  }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  const env = import.meta.env;
  return Boolean(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_AUTH_DOMAIN &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID
  );
}
