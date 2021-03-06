import CloudWatchLogs from 'aws-sdk/clients/cloudwatchlogs'
import { updateFunctionEnvironment } from '../lambda'

const putRetentionPolicy = async (logGroupNameEnv: string): Promise<void> => {
  const cloudWatchLogs = new CloudWatchLogs()
  await cloudWatchLogs
    .putRetentionPolicy({ logGroupName: logGroupNameEnv, retentionInDays: 1 })
    .promise()
}

type Handler<Event, Context, Result> = (event: Event, context: Context) => Promise<Result>

export function setupRetentionLogs<Event, Context, Result>(
  handler: Handler<Event, Context, Result>
): Handler<Event, Context, Result> {
  const logGroupNameEnv = process.env.AWS_LAMBDA_LOG_GROUP_NAME
  const resolveRetentionLogs = process.env.RESOLVE_RETENTION_LOGS
  const Region = process.env.AWS_REGION
  const FunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME

  return async (event: Event, context: Context): Promise<Result> => {
    if (
      resolveRetentionLogs != null ||
      logGroupNameEnv == null ||
      Region == null ||
      FunctionName == null
    ) {
      return handler(event, context)
    }

    const setupRetention = putRetentionPolicy(logGroupNameEnv)
    try {
      return await handler(event, context)
    } finally {
      await setupRetention
      await updateFunctionEnvironment({
        Region,
        FunctionName,
        Variables: {
          RESOLVE_RETENTION_LOGS: 'true'
        }
      })
    }
  }
}
