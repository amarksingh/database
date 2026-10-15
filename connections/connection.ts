const { Macroable } = require('@ostro/support/macro');
const ObjectGet = require('lodash.get');
const QueryBuilder = require('../query/builder');
const QueryGrammar = require('../query/grammars/grammar');
const Processor = require('../query/processors/processor');
const SchemaBuilder = require('../schema/builder');
const { debounce, is_callable, is_null } = require('@ostro/support/function');

/**
 * Class LostConnectionException.
 */
class LostConnectionException extends Error {
    /**
     * Create a new instance.
     * @param {*} message
     */
    constructor(message = 'Lost connection and no reconnector available.') {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Class Connection.
 */
class Connection extends Macroable {
    static $resolvers = {};

    $database;

    $tablePrefix;

    $config;

    $connection;

    $schemaGrammar;

    $postProcessor;

    $activeConnection = true;

    $beforeExecutingCallbacks = [];

    /**
     * Create a new instance.
     * @param {*} connection
     * @param {*} $database
     * @param {*} $tablePrefix
     * @param {*} $config
     */
    constructor(connection, $database = '', $tablePrefix = '', $config = {}) {
        super()

        this.$connection = typeof connection === 'function' ? connection($database, $tablePrefix) : connection;

        this.$database = $database;

        this.$tablePrefix = $tablePrefix;

        this.$config = $config;

        this.useDefaultQueryGrammar();
        this.useDefaultPostProcessor();

        if (this.$connection) {
            this.initiateAutoCloseConnection();
        }

    }

    /**
     * useDefaultQueryGrammar method.
     * @returns {any}
     */
    useDefaultQueryGrammar() {
        this.$queryGrammar = this.getDefaultQueryGrammar();
    }

    /**
     * getDefaultQueryGrammar method.
     * @returns {any}
     */
    getDefaultQueryGrammar() {
        let $grammar = new QueryGrammar();
        $grammar.setConnection(this);
        return $grammar;
    }

    /**
     * useDefaultSchemaGrammar method.
     * @returns {any}
     */
    useDefaultSchemaGrammar() {
        this.$schemaGrammar = this.getDefaultSchemaGrammar();
    }

    /**
     * getDefaultSchemaGrammar method.
     * @returns {any}
     */
    getDefaultSchemaGrammar() {
        //
    }

    /**
     * useDefaultPostProcessor method.
     * @returns {any}
     */
    useDefaultPostProcessor() {
        this.$postProcessor = this.getDefaultPostProcessor();
    }

    /**
     * getDefaultPostProcessor method.
     * @returns {any}
     */
    getDefaultPostProcessor() {
        return new Processor;
    }

    /**
     * getSchemaBuilder method.
     * @returns {any}
     */
    getSchemaBuilder() {
        if (is_null(this.$schemaGrammar)) {
            this.useDefaultSchemaGrammar();
        }

        return new SchemaBuilder(this);
    }

    /**
     * table method.
     * @param {*} $table
     * @param {*} $as
     * @returns {any}
     */
    table($table, $as) {
        return this.query().from($table, $as);
    }

    /**
     * query method.
     * @returns {any}
     */
    query() {
        return new QueryBuilder(
            this, this.getQueryGrammar(), this.$connection
        );
    }

    /**
     * transaction method.
     * @param {*} callback
     * @returns {any}
     */
    transaction(callback) {
        return this.$connection.transaction(callback);
    }

    /**
     * select method.
     * @async
     * @param {*} $query
     * @param {*} $bindings
     * @param {*} $useReadPdo
     * @returns {any}
     */
    async select($query, $bindings = [], $useReadPdo = true) {
        return this.run($query, $bindings);
    }

    /**
     * selectOne method.
     * @async
     * @param {*} $query
     * @param {*} $bindings
     * @param {*} $useReadPdo
     * @returns {any}
     */
    async selectOne($query, $bindings = [], $useReadPdo = true) {
        const $records = await this.select($query, $bindings, $useReadPdo);

        return Array.isArray($records) ? $records[0] : $records;
    }

    /**
     * insert method.
     * @param {*} $query
     * @param {*} $bindings
     * @returns {any}
     */
    insert($query, $bindings = []) {
        return this.statement($query, $bindings);
    }


    /**
     * update method.
     * @param {*} $query
     * @param {*} $bindings
     * @returns {any}
     */
    update($query, $bindings = []) {
        return this.affectingStatement($query, $bindings);
    }


    /**
     * delete method.
     * @param {*} $query
     * @param {*} $bindings
     * @returns {any}
     */
    delete($query, $bindings = []) {
        return this.affectingStatement($query, $bindings);
    }


    /**
     * statement method.
     * @param {*} $query
     * @param {*} $bindings
     * @returns {any}
     */
    statement($query, $bindings = []) {
        return this.run($query, $bindings);
    }

    /**
     * affectingStatement method.
     * @param {*} $query
     * @param {*} $bindings
     * @returns {any}
     */
    affectingStatement($query, $bindings = []) {
        return this.run($query, $bindings).then(res => {
            return res
        });
    }

    /**
     * run method.
     * @async
     * @param {*} $query
     * @param {*} $bindings
     * @param {*} $callback
     * @returns {any}
     */
    async run($query, $bindings, $callback = null) {
        for (let $beforeExecutingCallback of this.$beforeExecutingCallbacks) {
            $beforeExecutingCallback($query, $bindings, this);
        }

        this.reconnectIfMissingConnection();

        let $result;
        try {
            $result = await this.raw($query, $bindings, $callback);
        } catch ($e) {
            $result = this.handleQueryException(
                $e, $query, $bindings, $callback
            );
        }

        return $result;
    }
    /**
     * reconnect method.
     * @returns {any}
     */
    reconnect() {
        if (is_callable(this.$reconnector)) {
            return this.$reconnector(this);
        }

        throw new LostConnectionException('Lost connection and no reconnector available.');
    }

    /**
     * reconnectIfMissingConnection method.
     * @returns {any}
     */
    reconnectIfMissingConnection() {
        if (is_null(this.$connection)) {
            this.reconnect();
        }
    }

    /**
     * beforeExecuting method.
     * @param {*} $callback
     * @returns {any}
     */
    beforeExecuting($callback) {
        this.$beforeExecutingCallbacks.push($callback);
        return this;
    }

    /**
     * raw method.
     * @param {*} $value
     * @returns {any}
     */
    raw($value) {
        return this.$connection.raw($value);
    }

    /**
     * setReconnector method.
     * @param {*} $reconnector
     * @returns {any}
     */
    setReconnector($reconnector) {
        this.$reconnector = $reconnector;

        return this;
    }

    /**
     * getName method.
     * @returns {any}
     */
    getName() {
        return this.getConfig('name');
    }

    /**
     * getConfig method.
     * @param {*} $key
     * @param {*} $default
     * @returns {any}
     */
    getConfig($key, $default) {
        return ObjectGet(this.$config, $key, $default);
    }

    /**
     * getDriverName method.
     * @returns {any}
     */
    getDriverName() {
        return this.getConfig('driver');
    }

    /**
     * getQueryGrammar method.
     * @returns {any}
     */
    getQueryGrammar() {
        return this.$queryGrammar;
    }

    /**
     * setQueryGrammar method.
     * @param {*} $grammar
     * @returns {any}
     */
    setQueryGrammar($grammar) {
        this.$queryGrammar = $grammar;

        return this;
    }

    /**
     * getSchemaGrammar method.
     * @returns {any}
     */
    getSchemaGrammar() {
        return this.$schemaGrammar;
    }

    /**
     * setSchemaGrammar method.
     * @param {*} $grammar
     * @returns {any}
     */
    setSchemaGrammar($grammar) {
        this.$schemaGrammar = $grammar;

        return this;
    }

    /**
     * setPostProcessor method.
     * @param {*} $processor
     * @returns {any}
     */
    setPostProcessor($processor) {
        this.$postProcessor = $processor;
        return this;
    }

    /**
     * getPostProcessor method.
     * @returns {any}
     */
    getPostProcessor() {
        return this.$postProcessor;
    }

    /**
     * getDatabaseName method.
     * @returns {any}
     */
    getDatabaseName() {
        return this.$database;
    }

    /**
     * setReadConnection method.
     * @param {*} $readConnection
     * @returns {any}
     */
    setReadConnection($readConnection) {
        this.$readConnection = $readConnection;
        return this;
    }

    /**
     * getReadConnection method.
     * @returns {any}
     */
    getReadConnection() {
        if (this.$readConnection) {
            return typeof this.$readConnection === 'function' ? this.$readConnection(this.$database, this.$tablePrefix) : this.$readConnection;
        }
        return this.$connection;
    }

    /**
     * setDatabaseName method.
     * @param {*} $database
     * @returns {any}
     */
    setDatabaseName($database) {
        this.$database = $database;

        return this;
    }

    /**
     * getTablePrefix method.
     * @returns {any}
     */
    getTablePrefix() {
        return this.$tablePrefix;
    }

    /**
     * setTablePrefix method.
     * @param {*} $prefix
     * @returns {any}
     */
    setTablePrefix($prefix) {
        this.$tablePrefix = $prefix;

        this.getQueryGrammar().setTablePrefix($prefix);

        return this;
    }

    /**
     * withTablePrefix method.
     * @param {*} $grammar
     * @returns {any}
     */
    withTablePrefix($grammar) {
        $grammar.setTablePrefix(this.$tablePrefix);

        return $grammar;
    }

    /**
     * getColumnListing method.
     * @param {*} $table
     * @returns {any}
     */
    getColumnListing($table) {
        return this.getSchemaBuilder().getColumnListing($table);
    }


    /**
     * disconnect method.
     * @returns {any}
     */
    disconnect() {
        if (this.$disconnectTimer) {
            this.$disconnectTimer.clear();
        }
        if (this.$connection && typeof this.$connection.destroy === 'function') {
            this.$connection.destroy();
        }
        this.$activeConnection = false;
    }

    /**
     * initiateAutoCloseConnection method.
     * @returns {any}
     */
    initiateAutoCloseConnection() {
        let connectionCount = 0;
        let closeTime = this.$config['connectionCloseTime'] || 5000;
        let destroy = this.$config['destroy'] || true;

        const disconnectConnection = debounce(() => {
            if (destroy) {
                this.disconnect();
                this.$activeConnection = false;
            }
        }, closeTime);
        this.$disconnectTimer = disconnectConnection;

        if (!this.$connection?.client || typeof this.$connection.client.acquireConnection !== 'function') {
            return;
        }

        const acquireConnection = this.$connection.client.acquireConnection.bind(this.$connection.client)
        this.$connection.client.acquireConnection = () => {
            connectionCount++;
            disconnectConnection.clear();
            if (!this.$activeConnection) {
                this.$connection.initialize();
                this.$activeConnection = true;
            }
            return acquireConnection();
        };

        const closeConnection = () => {
            if (connectionCount > 0) {
                connectionCount--;
            }
            if (connectionCount == 0) {
                disconnectConnection();
            }
        };

        this.$connection.client.on('query-error', closeConnection);
        this.$connection.client.on('query-response', closeConnection);
    }


    /**
     * resolverFor method.
     * @static
     * @param {*} $driver
     * @param {*} $callback
     * @returns {any}
     */
    static resolverFor($driver, $callback) {
        this.$resolvers[$driver] = $callback;
    }

    /**
     * getResolver method.
     * @static
     * @param {*} $driver
     * @returns {any}
     */
    static getResolver($driver) {
        return this.$resolvers[$driver] || null;
    }
}

module.exports = Connection
