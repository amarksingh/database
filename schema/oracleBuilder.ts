const Builder = require('./builder')
/**
 * Class OracleSchema.
 */
class OracleSchema extends Builder {
    /**
     * dropAllTables method.
     * @async
     * @returns {any}
     */
    async dropAllTables() {
        const tables = await this.getAllTables();
        const promises = [];
        for (const name of tables) {
            promises.push(this.dropIfExists(name, true));
        }
        return Promise.all(promises)

    }

    /**
     * getAllTables method.
     * @returns {any}
     */
    getAllTables() {
        return this.$connection.table('user_tables')
            .pluck('table_name');
    }
}

module.exports = OracleSchema