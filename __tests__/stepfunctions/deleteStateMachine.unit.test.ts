import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { mockedSdkFunction } from '../mockedSdkFunction'
import deleteStepFunction from '../../stepfunctions/deleteStepFunction'

jest.mock('../../utils')

const mockListExecutions = mockedSdkFunction(StepFunctions.prototype.listExecutions)
const mockStopExecution = mockedSdkFunction(StepFunctions.prototype.stopExecution)
const mockDeleteStateMachine = mockedSdkFunction(StepFunctions.prototype.deleteStateMachine)
const mockDescribeStateMachine = mockedSdkFunction(StepFunctions.prototype.describeStateMachine)
const mockListTagsForResource = mockedSdkFunction(StepFunctions.prototype.listTagsForResource)

type AWSError = Error & { code?: string }

describe('deleteStepFunction', () => {
  afterEach(() => {
    mockListExecutions.mockClear()
    mockStopExecution.mockClear()
    mockDeleteStateMachine.mockClear()
    mockDescribeStateMachine.mockClear()
  })
  test('should step function has been deleted', async () => {
    mockListExecutions.mockResolvedValueOnce({
      executions: [
        {
          executionArn: 'executionArn',
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          status: 'status',
          startDate: new Date()
        }
      ],
      nextToken: 'nextToken'
    })
    mockListTagsForResource.mockResolvedValueOnce({
      tags: []
    })
    mockListExecutions.mockResolvedValue({
      executions: [
        {
          executionArn: 'executionArn',
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          status: 'status',
          startDate: new Date()
        }
      ]
    })
    mockDescribeStateMachine.mockResolvedValueOnce({
      status: 'DELETING',
      name: 'name',
      stateMachineArn: 'stateMachineArn',
      creationDate: new Date(),
      definition: 'definition',
      roleArn: 'roleArn',
      type: 'STANDARD'
    })
    mockDescribeStateMachine.mockRejectedValue(
      (function StateMachineDoesNotExist(): AWSError {
        const error: AWSError = new Error()
        error.code = 'StateMachineDoesNotExist'
        return error
      })()
    )
    await deleteStepFunction({
      Region: 'region',
      StepFunctionArn: 'stateMachineArn'
    })

    expect(mockListExecutions).toHaveBeenNthCalledWith(1, {
      stateMachineArn: 'stateMachineArn',
      statusFilter: 'RUNNING',
      maxResults: 30
    })
    expect(mockListExecutions).toHaveBeenNthCalledWith(2, {
      stateMachineArn: 'stateMachineArn',
      statusFilter: 'RUNNING',
      maxResults: 30,
      nextToken: 'nextToken'
    })
    expect(mockStopExecution).toHaveBeenCalledWith({
      executionArn: 'executionArn',
      cause: 'Delete the step function'
    })
    expect(mockDeleteStateMachine).toHaveBeenCalledWith({ stateMachineArn: 'stateMachineArn' })
  })

  test('should failed to delete step function', async () => {
    mockListExecutions.mockResolvedValue({
      executions: [
        {
          executionArn: 'executionArn',
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          status: 'status',
          startDate: new Date()
        }
      ]
    })
    mockDeleteStateMachine.mockRejectedValue(new Error())
    try {
      await deleteStepFunction({
        Region: 'region',
        StepFunctionArn: 'stateMachineArn'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
