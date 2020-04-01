const RDSDataService = jest.fn()

RDSDataService.prototype.executeStatement = jest.fn()

export default RDSDataService
