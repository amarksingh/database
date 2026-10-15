const { random, shuffle, wrap } = require('lodash');
const Connection = require('@ostro/database/connections/connection');
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException');
const { empty } = require('@ostro/support/function');
/**
 * Class ConnectionFactory.
 */
class ConnectionFactory {

    $container;

    /**
     * Create a new instance.
     * @param {*} container
     */
    constructor(container: any) {
        this.$container = container;
    }

    /**
     * make method.
     * @param {*} config
     * @param {*} name
     * @returns {any}
     */
    make(config: Record<string, any>, name: any = null) {
        config = this.parseConfig(config, name);

        if (config.read) {
            return this.createReadWriteConnection(config);
        }

        return this.createSingleConnection(config);
    }

    /**
     * parseConfig method.
     * @param {*} config
     * @param {*} name
     * @returns {any}
     */
    parseConfig(config: Record<string, any>, name: string) {
        return { prefix: '', ...config, name };
    }

    /**
     * createSingleConnection method.
     * @param {*} config
     * @returns {any}
     */
    createSingleConnection(config: Record<string, any>) {
        const connection = this.createConnectionResolver(config);

        return this.createConnection(config.driver, connection, config.database, config.prefix, config);
    }

    /**
     * createReadWriteConnection method.
     * @param {*} config
     * @returns {any}
     */
    createReadWriteConnection(config: Record<string, any>) {
        const connection = this.createSingleConnection(this.getWriteConfig(config));

        return connection.setReadConnection(this.createReadConnection(config));
    }

    /**
     * createReadConnection method.
     * @param {*} config
     * @returns {any}
     */
    createReadConnection(config: Record<string, any>) {
        return this.createConnectionResolver(this.getReadConfig(config));
    }

    /**
     * getReadConfig method.
     * @param {*} config
     * @returns {any}
     */
    getReadConfig(config: Record<string, any>) {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'read'));
    }

    /**
     * getWriteConfig method.
     * @param {*} config
     * @returns {any}
     */
    getWriteConfig(config: Record<string, any>) {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'write'));
    }

    /**
     * getReadWriteConfig method.
     * @param {*} config
     * @param {*} type
     * @returns {any}
     */
    getReadWriteConfig(config: Record<string, any>, type: string) {
        return config[type] && config[type][0] ? random(config[type]) : config[type];
    }

    /**
     * mergeReadWriteConfig method.
     * @param {*} config
     * @param {*} merge
     * @returns {any}
     */
    mergeReadWriteConfig(config: Record<string, any>, merge: any) {
        const { read, write, ...mergedConfig } = { ...config, ...merge };
        return mergedConfig;
    }

    /**
     * createConnectionResolver method.
     * @param {*} config
     * @returns {any}
     */
    createConnectionResolver(config: Record<string, any>) {
        return config.host ? this.createConnectionResolverWithHosts(config) : this.createConnectionResolverWithoutHosts(config);
    }

    /**
     * createConnectionResolverWithHosts method.
     * @param {*} config
     * @returns {any}
     */
    createConnectionResolverWithHosts(config: Record<string, any>) {
        return (database, prefix) => {
            config = { ...config, host: this.parseHost(config) }
            return this.createConnector(config).connect(config, database, prefix);
        };
    }

    /**
     * parseHost method.
     * @param {*} $config
     * @returns {any}
     */
    parseHost($config: Record<string, any>) {
        const hosts = Array.isArray($config['host']) ? $config['host'] : [$config['host']];
        if (empty(hosts)) {
            throw new InvalidArgumentException('Database hosts array is empty.');
        }

        return hosts;
    }


    /**
     * createConnectionResolverWithoutHosts method.
     * @param {*} config
     * @returns {any}
     */
    createConnectionResolverWithoutHosts(config: Record<string, any>) {
        return (database, prefix) => {
            return this.createConnector(config).connect(config, database, prefix);
        }
    }

    /**
     * createConnector method.
     * @param {*} config
     * @returns {any}
     */
    createConnector(config: Record<string, any>) {
        if (!config.driver) {
            throw new Error('A driver must be specified.');
        }

        const key = `db.connector.${config.driver}`;

        if (this.$container.bound(key)) {
            return this.$container.make(key);
        }

        switch (config.driver) {
            case 'mysql':
                return new (require('./mysqlConnector'))();
            case 'pgsql':
                return new (require('./postgresConnector'))();
            case 'sqlite':
                return new (require('./sqliteConnector'))();
            case 'oracle':
                return new (require('./oracleConnector'))();
            case 'sqlsrv':
                return new (require('./sqlServerConnector'))();
            default:
                throw new Error(`Unsupported driver [${config.driver}].`);
        }
    }

    /**
     * createConnection method.
     * @param {*} driver
     * @param {*} connection
     * @param {*} database
     * @param {*} prefix
     * @param {*} config
     * @returns {any}
     */
    createConnection(driver: any, connection: any, database: any, prefix: string = '', config: Record<string, any> = {}) {
        const resolver = Connection.getResolver(driver);

        if (resolver) {
            return resolver(connection, database, prefix, config);
        }

        switch (driver) {
            case 'mysql':
                return new (require('../connections/mysqlConnection'))(connection, database, prefix, config);
            case 'pgsql':
                return new (require('../connections/postgresConnection'))(connection, database, prefix, config);
            case 'sqlite':
                return new (require('../connections/sqliteConnection'))(connection, database, prefix, config);
            case 'oracle':
                return new (require('../connections/oracleConnection'))(connection, database, prefix, config);
            case 'sqlsrv':
                return new (require('../connections/sqlServerConnection'))(connection, database, prefix, config);
            default:
                throw new Error(`Unsupported driver [${driver}].`);
        }
    }
}

module.exports = ConnectionFactory;
