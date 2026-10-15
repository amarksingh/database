const Knex = require('knex');
/**
 * Class SqliteConnector.
 */
class SqliteConnector {
    /**
     * connect method.
     * @param {*} config
     * @param {*} database
     * @param {*} prefix
     * @returns {any}
     */
    connect(config: Record<string, any>, database: any, prefix: any) {
        return Knex({
            client: config.version || 'sqlite3',
            connection: {
                filename: database,
                options: config.options,
                flags: config.flags
            },
            pool: {
                afterCreate: (conn, done) => {
                    const enabled = config.foreign_key_constraints == true ? 'ON' : 'OFF';
                    conn.run(`PRAGMA foreign_keys = ${enabled};`, done);
                },
            },
            useNullAsDefault: config.useNullAsDefault != undefined ? config.useNullAsDefault : true,
            asyncStackTraces: config.asyncStackTraces != undefined ? config.asyncStackTraces : true
        });
    }
}

module.exports = SqliteConnector