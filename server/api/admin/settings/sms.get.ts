import { getAllSmsConfigs } from '../../../utils/sms'

export default defineEventHandler(async () => {
  const configs = await getAllSmsConfigs()
  return configs
})