const Knex = require('knex');

/**
 * Class SqlServerConnector.
 */
class SqlServerConnector {
    /**
     * connect method.
     * @param {*} config
     * @param {*} database
     * @param {*} prefix
     * @returns {any}
     */
    connect(config: Record<string, any>, database: any, prefix: any) {
        config.port = Number(config.port);
        return Knex({
            client: 'mssql',
            version: config.version,
            connection: {
                connectionString: config.DATABASE_URL,
                host: config.host[0],
                port: config.port,
                user: config.username,
                database: database,
                password: config.password,
                options: {
                    encrypt: config.encrypt
                },
            },
            pool: config.pool,
            acquireConnectionTimeout: config.connection_timeout,
            useNullAsDefault: config.useNullAsDefault != undefined ? config.useNullAsDefault : true,
            asyncStackTraces: config.asyncStackTraces != undefined ? config.asyncStackTraces : true
        });

    }
}

module.exports = SqlServerConnector