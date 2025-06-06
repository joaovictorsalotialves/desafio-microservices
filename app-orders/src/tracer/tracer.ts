import { trace } from '@opentelemetry/api'
import { env } from '../env/index.ts'

export const tracer = trace.getTracer(env.OTEL_SERVICE_NAME)
