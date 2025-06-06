import '@opentelemetry/auto-instrumentations-node/register'

import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { env } from '../env/index.ts'

import { setTimeout } from 'node:timers/promises'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'

import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { trace } from '@opentelemetry/api'
import { tracer } from '../tracer/tracer.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
  return 'OK'
})

app.post(
  '/orders',
  {
    schema: {
      body: z.object({
        amount: z.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body

    console.log('Creating an order with amount', amount)

    const orderId = randomUUID()

    await db.insert(schema.orders).values({
      id: orderId,
      customerId: '61e7d047-5708-42e3-b641-65b8820b6de9',
      amount,
    })

    const span = tracer.startSpan('Eu acho que aqui está dando merda')

    span.setAttribute('test', 'Hello World!')

    await setTimeout(2000)

    span.end()

    trace.getActiveSpan()?.setAttribute('order_id', orderId)

    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: '61e7d047-5708-42e3-b641-65b8820b6de9',
      },
    })

    return reply.status(201).send()
  }
)

app.listen({ host: '0.0.0.0', port: env.SERVER_PORT }).then(() => {
  console.log('🚀 [Orders] HTTP Server running!')
})
