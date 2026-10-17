const tsJestPath = "/Users/amarkumarsingh/.nvm/versions/node/v24.12.0/lib/node_modules/ts-jest";

export default {
    "testEnvironment": "node",
    "testMatch": [
        "**/test/**/*.test.ts",
        "**/test/**/*.test.js"
    ],
    "transform": {
        "^.+\\.ts$": [
            tsJestPath,
            {
                "tsconfig": "<rootDir>/tsconfig.json"
            }
        ]
    },
    "moduleNameMapper": {
        "^@ostro/support/(.*)$": "<rootDir>/../support/src/$1",
        "^@ostro/support$": "<rootDir>/../support/src",
        "^@ostro/contracts/(.*)$": "<rootDir>/../contracts/src/$1",
        "^@ostro/contracts$": "<rootDir>/../contracts/src",
        "^@ostro/pagination/(.*)$": "<rootDir>/../pagination/src/$1",
        "^@ostro/pagination$": "<rootDir>/../pagination/src/paginator",
        "^@ostro/console/(.*)$": "<rootDir>/../console/src/$1",
        "^@ostro/console$": "<rootDir>/../console/src/application",
        "^@ostro/container/(.*)$": "<rootDir>/../container/src/$1",
        "^@ostro/container$": "<rootDir>/../container/src/application",
        "^@ostro/database/(.*)$": "<rootDir>/src/$1",
        "^@ostro/database$": "<rootDir>/src/databaseManager"
    },
    "collectCoverage": false,
    "coverageDirectory": "coverage",
    "coverageReporters": [
        "text",
        "lcov",
        "clover"
    ],
    "collectCoverageFrom": [
        "<rootDir>/src/**/*.ts",
        "!<rootDir>/node_modules/**",
        "!<rootDir>/test/**",
        "!<rootDir>/coverage/**",
        "!<rootDir>/build/**",
        "!<rootDir>/jest.config.ts"
    ],
    "modulePathIgnorePatterns": [
        "<rootDir>/build/"
    ]
};
