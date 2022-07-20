/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*',
        '!**/index.ts',
        '!*/__test-files__/**/*'
    ],
    reporters: [
        'jest-standard-reporter'
    ]
};
