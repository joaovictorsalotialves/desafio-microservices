import amqp from 'amqplib'

import { env } from '../env/index.ts'

export const broker = await amqp.connect(env.BROKER_URL)
