import serverless from 'serverless-http'
import { createApp } from '../../../api/src/app'

export const handler = serverless(createApp())