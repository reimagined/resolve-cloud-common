import { UserStatusType } from 'aws-sdk/clients/cognitoidentityserviceprovider'

export const ADMIN_GROUP_NAME = 'Admin'
export const ADMIN_GROUP_DESCRIPTION = 'Admin group for IsAdmin flag'
export const SUB_ATTRIBUTE = 'sub'
export const EMAIL_ATTRIBUTE = 'email'

export type CognitoUser = {
  UserId: string
  Email: string
  Enabled: boolean
  UserStatus: UserStatusType
  IsAdmin: boolean
}
