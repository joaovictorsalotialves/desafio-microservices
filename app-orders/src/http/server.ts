import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { env } from '../env/index.ts'

import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'

import { dispatchOrderCreated } from '../broker/messages/order-created.ts'

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

    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: '61e7d047-5708-42e3-b641-65b8820b6de9',
      },
    })

    try {
      await db.insert(schema.orders).values({
        id: orderId,
        customerId: '61e7d047-5708-42e3-b641-65b8820b6de9',
        amount,
      })

      return reply.status(201).send()
    } catch (err) {
      console.log(err)

      return reply.status(500).send()
    }
  }
)

app.listen({ host: '0.0.0.0', port: env.SERVER_PORT }).then(() => {
  console.log('🚀 [Orders] HTTP Server running!')
})
