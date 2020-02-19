const StepFunctions = jest.fn()

StepFunctions.prototype.listExecutions = jest.fn()
StepFunctions.prototype.stopExecution = jest.fn()
StepFunctions.prototype.deleteStateMachine = jest.fn()
StepFunctions.prototype.listStateMachines = jest.fn()
StepFunctions.prototype.updateStateMachine = jest.fn()
StepFunctions.prototype.listTagsForResource = jest.fn()
StepFunctions.prototype.tagResource = jest.fn()
StepFunctions.prototype.untagResource = jest.fn()
StepFunctions.prototype.createStateMachine = jest.fn()
StepFunctions.prototype.describeStateMachine = jest.fn()

export default StepFunctions
