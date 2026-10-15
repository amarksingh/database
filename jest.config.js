const tsJestPath = "/Users/amarkumarsingh/.nvm/versions/node/v24.12.0/lib/node_modules/ts-jest";

module.exports = {
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
        "^@ostro/support/(.*)$": "<rootDir>/../support/$1",
        "^@ostro/support$": "<rootDir>/../support",
        "^@ostro/contracts/(.*)$": "<rootDir>/../contracts/$1",
        "^@ostro/contracts$": "<rootDir>/../contracts",
        "^@ostro/pagination/(.*)$": "<rootDir>/../pagination/$1",
        "^@ostro/pagination$": "<rootDir>/../pagination",
        "^@ostro/console/(.*)$": "<rootDir>/../console/$1",
        "^@ostro/console$": "<rootDir>/../console/application.js",
        "^@ostro/container/(.*)$": "<rootDir>/../container/$1",
        "^@ostro/container$": "<rootDir>/../container/application.js",
        "^@ostro/database/(.*)$": "<rootDir>/$1",
        "^@ostro/database$": "<rootDir>/databaseManager.js"
    },
    "collectCoverage": false,
    "coverageDirectory": "coverage",
    "coverageReporters": [
        "text",
        "lcov",
        "clover"
    ]
};
