const LogicException = require('@ostro/support/exceptions/logicException')
/**
 * Class Builder.
 */
class Builder {

    $connection;

    $grammar;

    $resolver;

    $defaultStringLength = 255;

    $defaultMorphKeyType = 'int';

    $alwaysUsesNativeSchemaOperationsIfPossible = false;

    /**
     * Create a new instance.
     * @param {*} $connection
     */
    constructor($connection: any) {
        this.$connection = $connection;
        this.$grammar = $connection.getSchemaGrammar();
    }

    get $schema() {
        return this.$connection.$connection.schema;
    }

    /**
     * create method.
     * @param {*} table
     * @param {*} cb
     * @returns {any}
     */
    create(table: string, cb: any) {
        return this.has(table).then(res => {
            if (!res)
                return this.createTable(table, cb)
        })

    }

    /**
     * createTable method.
     * @returns {any}
     */
    createTable() {
        return this.$schema.createTable(...arguments)
    }

    /**
     * createTableIfNotExists method.
     * @returns {any}
     */
    createTableIfNotExists() {
        return this.$schema.createTableIfNotExists(...arguments)
    }

    /**
     * drop method.
     * @returns {any}
     */
    drop() {
        return this.$schema.dropTable(...arguments)
    }

    /**
     * table method.
     * @returns {any}
     */
    table() {
        return this.$schema.table(...arguments)
    }

    /**
     * has method.
     * @returns {any}
     */
    has() {
        return this.hasTable(...arguments)
    }

    /**
     * hasTable method.
     * @returns {any}
     */
    hasTable() {
        return this.$schema.hasTable(...arguments)
    }

    /**
     * getColumnListing method.
     * @async
     * @param {*} tableName
     * @returns {any}
     */
    async getColumnListing(tableName: any) {
        const info = await this.$connection.table(tableName).columnInfo();
        return Object.keys(info);
    }

    /**
     * alter method.
     * @returns {any}
     */
    alter() {
        return this.$schema.alterTable(...arguments)
    }

    /**
     * raw method.
     * @returns {any}
     */
    raw() {
        return this.$schema.raw(...arguments)
    }

    /**
     * statement method.
     * @returns {any}
     */
    statement() {
        return this.raw(...arguments)
    }

    /**
     * dropTable method.
     * @returns {any}
     */
    dropTable() {
        return this.$schema.dropTable(...arguments)
    }

    /**
     * dropSchemaIfExists method.
     * @returns {any}
     */
    dropSchemaIfExists() {
        return this.$schema.dropSchemaIfExists(...arguments)
    }

    /**
     * dropIfExists method.
     * @param {*} tableName
     * @returns {any}
     */
    dropIfExists(tableName: any) {
        return this.dropTableIfExists(tableName)
    }

    /**
     * dropView method.
     * @returns {any}
     */
    dropView() {
        return this.$schema.dropView(...arguments)
    }

    /**
     * dropViewIfExists method.
     * @returns {any}
     */
    dropViewIfExists() {
        return this.$schema.dropViewIfExists(...arguments)
    }

    /**
     * dropMaterializedView method.
     * @returns {any}
     */
    dropMaterializedView() {
        return this.$schema.dropMaterializedView(...arguments)
    }

    /**
     * renameView method.
     * @returns {any}
     */
    renameView() {
        return this.$schema.renameView(...arguments)
    }

    /**
     * alterView method.
     * @returns {any}
     */
    alterView() {
        return this.$schema.renameView(...arguments)
    }

    /**
     * renameTable method.
     * @returns {any}
     */
    renameTable() {
        return this.$schema.renameTable(...arguments)
    }

    /**
     * createView method.
     * @returns {any}
     */
    createView() {
        return this.$schema.createView(...arguments)
    }

    /**
     * dropTableIfExists method.
     * @param {*} tableName
     * @returns {any}
     */
    dropTableIfExists(tableName: any) {
        return this.$schema.dropTableIfExists(tableName)

    }

    /**
     * dropSchema method.
     * @returns {any}
     */
    dropSchema() {
        return this.$schema.dropSchema(...arguments)

    }

    /**
     * createDatabase method.
     * @returns {any}
     */
    createDatabase() {
        throw new LogicException('This database driver does not support creating databases.');
    }

    /**
     * dropDatabaseIfExists method.
     * @returns {any}
     */
    dropDatabaseIfExists() {
        throw new LogicException('This database driver does not support dropping databases.');
    }

    /**
     * getTypes method.
     * @returns {any}
     */
    getTypes() {
        throw new LogicException('This database driver does not support user-defined types.');
    }

    /**
     * getAllTables method.
     * @returns {any}
     */
    getAllTables() {
        throw new LogicException('This database driver does not support getting all tables.');
    }


    /**
     * dropAllTables method.
     * @returns {any}
     */
    dropAllTables() {
        throw new LogicException('This database driver does not support dropping all tables.');
    }

    /**
     * dropAllViews method.
     * @returns {any}
     */
    dropAllViews() {
        throw new LogicException('This database driver does not support dropping all views.');

    }

    /**
     * dropAllTypes method.
     * @returns {any}
     */
    dropAllTypes() {
        throw new LogicException('This database driver does not support dropping all types.');

    }
}
module.exports = Builder
