function highloadExecute(
  method: Function
): (
  params: object
) => {
  promise(): Promise<any>
} {
  return function wrapper(
    params: object
  ): {
    promise(): Promise<any>
  } {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const target = this
    return {
      async promise(): Promise<any> {
        try {
          return await method.call(target, params).promise()
        } catch (error) {
          if (
            error != null &&
            (/Request timed out/i.test(error.message) ||
              /Remaining connection slots are reserved/i.test(error.message) ||
              /I\/O error occured while sending to the backend/i.test(error.message) ||
              /in a read-only transaction/i.test(error.message))
          ) {
            const highloadError = new Error(error.message)
            // eslint-disable-next-line no-void
            void ((highloadError as any).code = 'LimitExceededException')
            throw highloadError
          } else {
            throw error
          }
        }
      },
    }
  }
}

export { highloadExecute }
