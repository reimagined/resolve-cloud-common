const SecretsManager = jest.fn()

SecretsManager.prototype.getRandomPassword = jest.fn()
SecretsManager.prototype.createSecret = jest.fn()
SecretsManager.prototype.deleteSecret = jest.fn()

export default SecretsManager
