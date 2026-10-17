import Knex from 'knex';

/**
 * Class OracleConnector.
 */
class OracleConnector {

    /**
     * Establish a database connection.
     *
     * @param config - Database configuration.
     * @param database - Database name.
     * @param prefix - Table prefix.
     * @returns Knex client instance.
     */
    public connect(config: Record<string, any>, database: any, prefix: any): any {
        config.port = Number(config.port);

        return Knex({
            client: 'oracledb',
            version: config.version,
            connection: {
                host: config.host[0],
                port: config.port,
                user: config.username,
                database: database,
                password: config.password,
            },
            useNullAsDefault: config.useNullAsDefault != undefined ? config.useNullAsDefault : true,
            asyncStackTraces: config.asyncStackTraces != undefined ? config.asyncStackTraces : true
        });
    }
}

/* c8 ignore next */
export default OracleConnector;