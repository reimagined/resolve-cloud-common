import getFunctionConcurrency from '../lambda/getFunctionConcurrency'
import { getLog } from './log'

export function throttleChecker(): void {
  const log = getLog('THROTTLE CHECKER')
  setInterval(async () => {
    if (process.env.AWS_REGION != null && process.env.AWS_LAMBDA_FUNCTION_NAME != null) {
      try {
        const concurrency = await getFunctionConcurrency({
          Region: process.env.AWS_REGION,
          FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME
        })
        if (concurrency === 0) {
          log.debug('concurrency 0')
          process.exit(1)
        }
      } catch (error) {
        log.error(error)
        if (error != null && error.code === 'ResourceNotFoundException') {
          process.exit(1)
        }
      }
    }
  }, 15000)
}
