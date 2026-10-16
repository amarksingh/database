import Knex from 'knex';

/**
 * Class SqliteConnector.
 */
class SqliteConnector {
    /**
     * Establish a database connection.
     *
     * @param config - Database configuration.
     * @param database - Database file path or memory string.
     * @param prefix - Table prefix.
     * @returns Knex client instance.
     */
    connect(config: Record<string, any>, database: any, prefix: any): any {
        return Knex({
            client: config.version || 'sqlite3',
            connection: {
                filename: database,
                options: config.options,
                flags: config.flags
            },
            pool: {
                afterCreate: (conn: any, done: Function) => {
                    const enabled = config.foreign_key_constraints == true ? 'ON' : 'OFF';
                    conn.run(`PRAGMA foreign_keys = ${enabled};`, done);
                },
            },
            useNullAsDefault: config.useNullAsDefault != undefined ? config.useNullAsDefault : true,
            asyncStackTraces: config.asyncStackTraces != undefined ? config.asyncStackTraces : true
        });
    }
}

/* c8 ignore next */
export default SqliteConnector;