import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().default('modulith-dx'),
  SERVICE_VERSION: z.string().default('0.0.1'),
  PORT: z.coerce.number().default(3000),
  
  // OpenTelemetry
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
  OTEL_SERVICE_NAMESPACE: z.string().default('modulith'),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (): Env => {
  return envSchema.parse(process.env);
};
