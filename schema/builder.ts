import LogicException from '@ostro/support/exceptions/logicException';

/**
 * Class Builder.
 */
class Builder {

    /* c8 ignore next */
    $connection: any;

    $grammar: any;

    $resolver: any;

    $defaultStringLength: number = 255;

    $defaultMorphKeyType: string = 'int';

    $alwaysUsesNativeSchemaOperationsIfPossible: boolean = false;

    /**
     * Create a new schema builder instance.
     *
     * @param connection - Connection instance.
     */
    constructor(connection: any) {
        this.$connection = connection;
        this.$grammar = connection.getSchemaGrammar();
    }

    get $schema(): any {
        return this.$connection.$connection.schema;
    }

    /**
     * Create a new table on the schema if it does not exist.
     *
     * @param table - Table name.
     * @param cb - Blueprint callback.
     * @returns Promise resolving to created table or undefined.
     */
    create(table: string, cb: any): Promise<any> {
        return this.has(table).then((res: boolean) => {
            if (!res) {
                return this.createTable(table, cb);
            }
        });
    }

    /**
     * Create a new table on the schema.
     *
     * @param args - Arguments forwarded to knex schema createTable.
     * @returns Knex schema builder promise.
     */
    createTable(...args: any[]): any {
        return this.$schema.createTable(...args);
    }

    /**
     * Create a table if it doesn't already exist.
     *
     * @param args - Arguments forwarded to knex schema createTableIfNotExists.
     * @returns Knex schema builder promise.
     */
    createTableIfNotExists(...args: any[]): any {
        return this.$schema.createTableIfNotExists(...args);
    }

    /**
     * Drop a table from the schema.
     *
     * @param args - Arguments forwarded to dropTable.
     * @returns Knex schema builder promise.
     */
    drop(...args: any[]): any {
        return this.$schema.dropTable(...args);
    }

    /**
     * Modify an existing table on the schema.
     *
     * @param args - Arguments forwarded to knex schema table.
     * @returns Knex schema builder promise.
     */
    table(...args: any[]): any {
        return this.$schema.table(...args);
    }

    /**
     * Determine if the given table exists.
     *
     * @param args - Table name arguments.
     * @returns Promise resolving to boolean.
     */
    has(...args: any[]): any {
        return this.hasTable(...args);
    }

    /**
     * Determine if the given table exists.
     *
     * @param args - Table name arguments.
     * @returns Promise resolving to boolean.
     */
    hasTable(...args: any[]): any {
        return this.$schema.hasTable(...args);
    }

    /**
     * Get the column listing for a given table.
     *
     * @param tableName - Name of table.
     * @returns Array of column names.
     */
    async getColumnListing(tableName: string): Promise<string[]> {
        const info = await this.$connection.table(tableName).columnInfo();
        return Object.keys(info);
    }

    /**
     * Alter an existing table on the schema.
     *
     * @param args - Arguments forwarded to alterTable.
     * @returns Knex schema builder promise.
     */
    alter(...args: any[]): any {
        return this.$schema.alterTable(...args);
    }

    /**
     * Execute a raw SQL schema statement.
     *
     * @param args - Raw SQL statement arguments.
     * @returns Result of raw statement.
     */
    raw(...args: any[]): any {
        return this.$schema.raw(...args);
    }

    /**
     * Execute a raw schema statement.
     *
     * @param args - Raw schema arguments.
     * @returns Result of raw statement.
     */
    statement(...args: any[]): any {
        return this.raw(...args);
    }

    /**
     * Drop a table from the schema.
     *
     * @param args - Arguments forwarded to dropTable.
     * @returns Knex schema builder promise.
     */
    dropTable(...args: any[]): any {
        return this.$schema.dropTable(...args);
    }

    /**
     * Drop a schema if it exists.
     *
     * @param args - Arguments forwarded to dropSchemaIfExists.
     * @returns Knex schema builder promise.
     */
    dropSchemaIfExists(...args: any[]): any {
        return this.$schema.dropSchemaIfExists(...args);
    }

    /**
     * Drop a table from the schema if it exists.
     *
     * @param tableName - Table name to drop.
     * @returns Knex schema builder promise.
     */
    dropIfExists(tableName: any): any {
        return this.dropTableIfExists(tableName);
    }

    /**
     * Drop a view from the schema.
     *
     * @param args - Arguments forwarded to dropView.
     * @returns Knex schema builder promise.
     */
    dropView(...args: any[]): any {
        return this.$schema.dropView(...args);
    }

    /**
     * Drop a view from the schema if it exists.
     *
     * @param args - Arguments forwarded to dropViewIfExists.
     * @returns Knex schema builder promise.
     */
    dropViewIfExists(...args: any[]): any {
        return this.$schema.dropViewIfExists(...args);
    }

    /**
     * Drop a materialized view from the schema.
     *
     * @param args - Arguments forwarded to dropMaterializedView.
     * @returns Knex schema builder promise.
     */
    dropMaterializedView(...args: any[]): any {
        return this.$schema.dropMaterializedView(...args);
    }

    /**
     * Rename a view on the schema.
     *
     * @param args - Arguments forwarded to renameView.
     * @returns Knex schema builder promise.
     */
    renameView(...args: any[]): any {
        return this.$schema.renameView(...args);
    }

    /**
     * Alter a view on the schema.
     *
     * @param args - Arguments forwarded to renameView.
     * @returns Knex schema builder promise.
     */
    alterView(...args: any[]): any {
        return this.$schema.renameView(...args);
    }

    /**
     * Rename a table on the schema.
     *
     * @param args - Arguments forwarded to renameTable.
     * @returns Knex schema builder promise.
     */
    renameTable(...args: any[]): any {
        return this.$schema.renameTable(...args);
    }

    /**
     * Create a view on the schema.
     *
     * @param args - Arguments forwarded to createView.
     * @returns Knex schema builder promise.
     */
    createView(...args: any[]): any {
        return this.$schema.createView(...args);
    }

    /**
     * Drop a table from the schema if it exists.
     *
     * @param tableName - Table name to drop.
     * @returns Knex schema builder promise.
     */
    dropTableIfExists(tableName: any): any {
        return this.$schema.dropTableIfExists(tableName);
    }

    /**
     * Drop a database schema.
     *
     * @param args - Arguments forwarded to dropSchema.
     * @returns Knex schema builder promise.
     */
    dropSchema(...args: any[]): any {
        return this.$schema.dropSchema(...args);
    }

    /**
     * Create a new database.
     *
     * @throws LogicException
     */
    createDatabase(): never {
        throw new LogicException('This database driver does not support creating databases.');
    }

    /**
     * Drop a database if it exists.
     *
     * @throws LogicException
     */
    dropDatabaseIfExists(): never {
        throw new LogicException('This database driver does not support dropping databases.');
    }

    /**
     * Get user-defined types.
     *
     * @throws LogicException
     */
    getTypes(): never {
        throw new LogicException('This database driver does not support user-defined types.');
    }

    /**
     * Get all database tables.
     *
     * @throws LogicException
     */
    getAllTables(): never {
        throw new LogicException('This database driver does not support getting all tables.');
    }

    /**
     * Drop all tables from the database.
     *
     * @throws LogicException
     */
    dropAllTables(): never {
        throw new LogicException('This database driver does not support dropping all tables.');
    }

    /**
     * Drop all views from the database.
     *
     * @throws LogicException
     */
    dropAllViews(): never {
        throw new LogicException('This database driver does not support dropping all views.');
    }

    /**
     * Drop all user-defined types from the database.
     *
     * @throws LogicException
     */
    dropAllTypes(): never {
        throw new LogicException('This database driver does not support dropping all types.');
    }
}

/* c8 ignore next */
export default Builder;
