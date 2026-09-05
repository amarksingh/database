const lodash = require('lodash')
const ConfigurationUrlParser = require('@ostro/support/configurationUrlParser');
const { Macroable } = require('@ostro/support/macro');
const { isset, tap, env } = require('@ostro/support/function');
class DatabaseManager extends Macroable {

    $type = 'database';
    $connections = {};
    $extensions = {};
    $container;
    $app;
    $factory;
    $reconnector;

    constructor($container, $factory) {
        super();
        this.$app = $container;
        this.$factory = $factory;
        this.$reconnector = ($connection) => {
            this.reconnect($connection.getName());
        };
    }

    builder($name = null) {
        return this.connection($name);
    }

    connection(name = null) {
        const [database, type] = this.parseConnectionName(name);
        name = name || database;

        if (!this.$connections[name]) {
            this.$connections[name] = this.configure(
                this.makeConnection(database),
                type
            );
        }

        return this.$connections[name];
    }

    parseConnectionName(name) {
        name = name || this.getDefaultConnection();
        return name.endsWith('::read') || name.endsWith('::write')
            ? name.split('::', 2)
            : [name, null];
    }

    makeConnection(name) {
        const config = this.configuration(name);

        if (this.$extensions[name]) {
            return this.$extensions[name](config, name);
        }

        const driver = config['driver'];

        if (this.$extensions[driver]) {
            return this.$extensions[driver](config, name);
        }

        return this.$factory.make(config, name);
    }
    configuration(name) {
        name = name || this.getDefaultConnection();
        const connections = lodash.get(this.$app['config'], 'database.connections', {})

        if (!connections[name]) {
            throw new Error(`Database connection [${name}] not configured.`);
        }

        return new ConfigurationUrlParser().parseConfiguration(connections[name]);
    }

    configure(connection, type) {
        if (connection && typeof connection.setReconnector === 'function') {
            connection.setReconnector(this.$reconnector);
        }

        return connection;
    }

    purge($name = null) {
        $name = $name || this.getDefaultConnection();

        this.disconnect($name);

        delete this.$connections[$name];
    }


    disconnect($name = null) {
        $name = $name || this.getDefaultConnection();
        if (isset(this.$connections[$name])) {
            this.$connections[$name].disconnect();
        }
    }

    reconnect($name = null) {
        $name = $name || this.getDefaultConnection();
        this.disconnect($name);

        if (!isset(this.$connections[$name])) {
            return this.connection($name);
        }

        return this.refreshConnections($name);
    }

    refreshConnections($name) {
        return this.$connections[$name] = this.configure(
            this.makeConnection($name)
        );
    }

    usingConnection($name, $callback) {
        const $previousName = this.getDefaultConnection();

        this.setDefaultConnection($name);

        return tap($callback(), () => {
            this.setDefaultConnection($previousName);
        });
    }

    getDefaultConnection() {
        return lodash.get(this.$app['config'], 'database.default');
    }

    setDefaultConnection($name) {
        lodash.set(this.$app['config'], 'database.default', $name);
    }

    supportedDrivers() {
        return ['mysql', 'pgsql', 'sqlite', 'sqlsrv', 'oracle'];
    }

    extend($name, $resolver) {
        this.$extensions[$name] = $resolver;
    }

    forgetExtension($name) {
        delete this.$extensions[$name];
    }
    getConnections() {
        return this.$connections;
    }

    setReconnector($reconnector) {
        this.$reconnector = $reconnector;
    }

    getPrefix() {
        return this.getConfig(`prefix`);
    }

    getConfig(name) {
        return lodash.get(this.$app['config'], `database.connections.${name}`);
    }

    registerCommands(dir) {
        const container = this.$container || this.$app;
        if (container && container.console && typeof container.console.load == 'function' && !env('production')) {
            container.console.load(dir);
        }
    }
    __call($target, $method, $parameters) {
        return $target.connection()[$method](...$parameters);
    }

}

module.exports = DatabaseManager
