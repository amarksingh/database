const Grammar = require('./grammar');

/**
 * Class SqliteGrammar.
 */
class SqliteGrammar extends Grammar {
    /**
     * compileDropAllTables method.
     * @param {*} tables
     * @returns {any}
     */
    compileDropAllTables(tables) {
        let sql = ``;
        for (let table of tables) {
            sql += `DROP TABLE IF EXISTS ${table};`;
        }
        return sql;
    }
}

module.exports = SqliteGrammar;