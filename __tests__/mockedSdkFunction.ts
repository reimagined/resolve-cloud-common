import { PromiseResult } from 'aws-sdk/lib/request'

export function mockedSdkFunction<TParams extends object, TResponse extends object>(
  callable: (params: TParams) => { promise: () => Promise<PromiseResult<TResponse, any>> }
): jest.MockedFunction<(params: TParams) => Promise<TResponse>> {
  return callable as any
}
