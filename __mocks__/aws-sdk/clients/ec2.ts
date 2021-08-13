const EC2 = jest.fn()

EC2.prototype.createSubnet = jest.fn()
EC2.prototype.deleteRoute = jest.fn()
EC2.prototype.createRoute = jest.fn()
EC2.prototype.createRouteTable = jest.fn()
EC2.prototype.createNatGateway = jest.fn()
EC2.prototype.allocateAddress = jest.fn()
EC2.prototype.attachInternetGateway = jest.fn()
EC2.prototype.createInternetGateway = jest.fn()
EC2.prototype.associateRouteTable = jest.fn()

export default EC2
