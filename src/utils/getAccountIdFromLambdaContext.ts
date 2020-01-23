export function getAccountIdFromLambdaContext(lambdaContext: {
  invokedFunctionArn: string;
}): string {
  return lambdaContext.invokedFunctionArn.split(":")[4];
}
