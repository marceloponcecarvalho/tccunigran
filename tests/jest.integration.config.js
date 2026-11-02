//configuração de integração ficará isolada em tests/integration, e o banco selecionado será sempre manutencao_piscinas_test
module.exports = {
    rootDir: '..',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/setupIntegration.js']
};