import StepFunctions from 'aws-sdk/clients/stepfunctions'

import { mockedSdkFunction } from '../mockedSdkFunction'
import ensureStepFunction from '../../stepfunctions/ensureStepFunction'

jest.mock('../../utils')

const mockListStateMachines = mockedSdkFunction(StepFunctions.prototype.listStateMachines)
const mockUpdateStateMachine = mockedSdkFunction(StepFunctions.prototype.updateStateMachine)
const mockListTagsForResource = mockedSdkFunction(StepFunctions.prototype.listTagsForResource)
const mockTagResource = mockedSdkFunction(StepFunctions.prototype.tagResource)
const mockUntagResource = mockedSdkFunction(StepFunctions.prototype.untagResource)
const mockCreateStateMachine = mockedSdkFunction(StepFunctions.prototype.createStateMachine)
const mockListExecutions = mockedSdkFunction(StepFunctions.prototype.listExecutions)
const mockStopExecution = mockedSdkFunction(StepFunctions.prototype.stopExecution)

describe('ensureStepFunction', () => {
  afterEach(() => {
    mockListStateMachines.mockClear()
    mockUpdateStateMachine.mockClear()
    mockListTagsForResource.mockClear()
    mockTagResource.mockClear()
    mockUntagResource.mockClear()
    mockCreateStateMachine.mockClear()
    mockListExecutions.mockClear()
    mockStopExecution.mockClear()
  })
  test('should step function has been ensure', async () => {
    mockListStateMachines.mockResolvedValue({
      stateMachines: [
        {
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          creationDate: new Date(),
          type: 'STANDARD'
        }
      ]
    })
    mockUpdateStateMachine.mockResolvedValue({ updateDate: new Date() })
    mockListTagsForResource.mockResolvedValue({
      tags: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' }
      ]
    })
    mockTagResource.mockResolvedValue({})
    mockUntagResource.mockResolvedValue({})
    mockListExecutions.mockResolvedValueOnce({
      executions: [
        {
          executionArn: 'executionArn',
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          startDate: new Date(),
          status: 'status'
        }
      ]
    })
    mockListExecutions.mockResolvedValue({ executions: [] })
    mockStopExecution.mockResolvedValue({ stopDate: new Date() })

    const result = await ensureStepFunction({
      Region: 'region',
      RoleArn: 'roleArn',
      Definition: {},
      Name: 'name'
    })

    expect(mockListStateMachines).toHaveBeenCalledWith({})
    expect(mockUpdateStateMachine).toHaveBeenCalledWith({
      roleArn: 'roleArn',
      definition: JSON.stringify({}),
      stateMachineArn: 'stateMachineArn'
    })
    expect(mockListTagsForResource).toHaveBeenCalledWith({ resourceArn: 'stateMachineArn' })
    expect(mockTagResource).toHaveBeenCalledWith({
      resourceArn: 'stateMachineArn',
      tags: [
        {
          key: 'Owner',
          value: 'reimagined'
        }
      ]
    })
    expect(mockUntagResource).toHaveBeenCalledWith({
      resourceArn: 'stateMachineArn',
      tagKeys: ['key1', 'key2']
    })
    expect(mockListExecutions).toHaveBeenCalledWith({
      stateMachineArn: 'stateMachineArn',
      statusFilter: 'RUNNING'
    })
    expect(mockStopExecution).toHaveBeenCalledWith({
      executionArn: 'executionArn'
    })
    expect(mockCreateStateMachine).not.toHaveBeenCalled()
    expect(result).toEqual('stateMachineArn')
  })

  test('should step function has been created with ARN', async () => {
    const error: Error & { code?: string } = new Error()
    error.code = 'StateMachineDoesNotExist'
    mockListExecutions.mockRejectedValue(error)
    mockListStateMachines.mockResolvedValue({
      stateMachines: [
        {
          type: 'STANDARD',
          stateMachineArn: 'stateMachineArn',
          name: 'name',
          creationDate: new Date()
        }
      ]
    })
    mockUpdateStateMachine.mockResolvedValue({ updateDate: new Date() })
    mockListTagsForResource.mockResolvedValue({
      tags: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' }
      ]
    })
    mockTagResource.mockResolvedValue({})
    mockUntagResource.mockResolvedValue({})
    mockListExecutions.mockResolvedValue({ executions: [] })
    mockStopExecution.mockResolvedValue({ stopDate: new Date() })
    mockCreateStateMachine.mockResolvedValue({
      stateMachineArn: 'stateMachineArn',
      creationDate: new Date()
    })

    const result = await ensureStepFunction({
      Region: 'region',
      RoleArn: 'roleArn',
      Definition: {},
      Name: 'name'
    })
    expect(result).toEqual('stateMachineArn')
  })

  test('should failed to ensure step function', async () => {
    mockListExecutions.mockRejectedValue(new Error())
    try {
      await ensureStepFunction({
        Region: 'region',
        RoleArn: 'roleArn',
        Definition: {},
        Name: 'name'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})
