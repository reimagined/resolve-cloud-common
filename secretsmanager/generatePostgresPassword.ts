import generatePassword from './generatePassword'

import { getLog, Log } from '../utils'

const generatePostgresPassword = async (
  params: {
    Region: string
  },
  log: Log = getLog('GENERATE-POSTGRESQL-PASSWORD')
): Promise<string> => {
  const { Region } = params

  return generatePassword(
    {
      Region,
      ExcludePunctuation: true,
      IncludeSpace: false,
      PasswordLength: 30,
      RequireEachIncludedType: true
    },
    log
  )
}

export default generatePostgresPassword
