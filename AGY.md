# @ostro/database — Antigravity AI Architecture & Knowledge Base

> **Package Name**: `@ostro/database`
> **Version**: `2.0.0-alpha.1`
> **Role in Ecosystem**: Modular Core Framework Library

---

## 1. Package Purpose & Overview
Full-featured database engine with multi-driver connectors (MySQL, PostgreSQL, SQLite, Oracle, SQL Server), Query Builder, Migrations, and Eloquent ORM.

- **Primary Architectural Patterns**: Active Record ORM, Grammar & Processor driver bridges, Connection pooling.
- **Key Exported Entities**: `DatabaseManager`, `Connection`, `Builder (Query)`, `Model (Eloquent)`, `Migrator`, `Schema`

---

## 2. Dependencies & Interoperability
- **Direct Dependencies**:
  - `@ostro/contracts`: `^1.0.2`
  - `@ostro/pagination`: `^1.0.4`
  - `@ostro/support`: `^1.2.0`
  - `fs-extra`: `^8.1.0`
  - `knex`: `^2.3.0`
  - `lodash`: `^4.17.21`
  - `lodash.get`: `^4.4.2`
  - `sqlite3`: `^6.0.1`
- **Framework Consumers**: Consumed across the OstroJS ecosystem via `@ostro/framework` and direct imports.

---

## 3. Directory & Source Layout
```text
origin/database/
├── connections/connection.ts
├── connections/mysqlConnection.ts
├── connections/oracleConnection.ts
├── connections/postgresConnection.ts
├── connections/sqlServerConnection.ts
├── connections/sqliteConnection.ts
├── connectors/connectionFactory.ts
├── connectors/connector.ts
├── connectors/mysqlConnector.ts
├── connectors/oracleConnector.ts
├── connectors/postgresConnector.ts
├── connectors/sqlServerConnector.ts
├── connectors/sqliteConnector.ts
├── console/databaseQuery.ts
├── console/dumpCommand.ts
├── console/factories/factoryMakeCommand.ts
├── console/migrations/baseCommand.ts
├── console/migrations/freshCommand.ts
├── console/migrations/installCommand.ts
├── console/migrations/migrateCommand.ts
└── ... (70 more files)
```

---

## 4. TypeScript Typing & Code Standards
1. **Access Modifiers**: All class properties and methods declare explicit visibility (`public`, `protected`, `private`).
2. **Inheritance & Overrides**: Classes overriding base class methods use the `override` keyword to safeguard contracts.
3. **Immutability**: Constant lookup tables and static registries use `readonly` and strict record types.
4. **No Implicit Any**: Public APIs avoid `any` in favor of generics (`<T = unknown>`) and typed contracts from `@ostro/contracts`.
5. **Contract Binding**: Core managers implement contracts from `@ostro/contracts/database/*`.

---

## 5. Development & Verification Guide
- **Compile / Build**: `npm run build` (runs `rm -rf build && npx tsc -p tsconfig.build.json`)
- **Run Tests**: `npm test` (executes Jest with 100% coverage target via `c8`)
- **Published Artifacts**: Target output compiled to `./build` with accompanying `.d.ts` declarations and source maps.

---
*Generated for Antigravity AI high-speed codebase comprehension with minimal token consumption.*
