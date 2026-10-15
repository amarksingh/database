const Grammar = require('./grammar');

/**
 * Class MysqlGrammar.
 */
class MysqlGrammar extends Grammar {
    /**
     * compileDropAllTables method.
     * @param {*} tables
     * @returns {any}
     */
    compileDropAllTables(tables) {
        return `DROP TABLE IF EXISTS ${tables.join(', ')}; `;
    }
}

module.exports = MysqlGrammar;