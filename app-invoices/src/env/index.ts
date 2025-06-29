import { z } from 'zod'

const envSchema = z.object({
  // SERVER
  SERVER_PORT: z.coerce.number().default(3333),
  // DATABASE
  DATABASE_URL: z.string().url(),
  // BROKER
  BROKER_URL: z.string().url(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format())

  throw new Error('Invalid environment variables.')
}

export const env = _env.data
