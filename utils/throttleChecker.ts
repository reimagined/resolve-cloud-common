import getFunctionConcurrency from '../lambda/getFunctionConcurrency'

export function throttleChecker(): void {
  setInterval(async () => {
    if (process.env.AWS_REGION != null && process.env.AWS_LAMBDA_FUNCTION_NAME != null) {
      try {
        const concurrency = await getFunctionConcurrency({
          Region: process.env.AWS_REGION,
          FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME
        })
        if (concurrency === 0) {
          process.exit(1)
        }
      } catch (e) {
        process.exit(1)
      }
    }
  }, 15000)
}
