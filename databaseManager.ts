import lodash from 'lodash';
import ConfigurationUrlParser from '@ostro/support/configurationUrlParser';
import { Macroable } from '@ostro/support/macro';
import { isset, tap, env } from '@ostro/support/function';
/**
 * Class DatabaseManager.
 */
class DatabaseManager extends Macroable {

    $type = 'database';
    $connections = {};
    $extensions = {};
    $container;
    $app;
    $factory;
    $reconnector;

    /**
     * Create a new instance.
     * @param {*} $container
     * @param {*} $factory
     */
    constructor($container: any, $factory: any) {
        super();
        this.$app = $container;
        this.$factory = $factory;
        this.$reconnector = ($connection) => {
            this.reconnect($connection.getName());
        };
    }

    /**
     * builder method.
     * @param {*} $name
     * @returns {any}
     */
    builder($name: any = null) {
        return this.connection($name);
    }

    /**
     * connection method.
     * @param {*} name
     * @returns {any}
     */
    connection(name: any = null) {
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

    /**
     * parseConnectionName method.
     * @param {*} name
     * @returns {any}
     */
    parseConnectionName(name: string) {
        name = name || this.getDefaultConnection();
        return name.endsWith('::read') || name.endsWith('::write')
            ? name.split('::', 2)
            : [name, null];
    }

    /**
     * makeConnection method.
     * @param {*} name
     * @returns {any}
     */
    makeConnection(name: string) {
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
    /**
     * configuration method.
     * @param {*} name
     * @returns {any}
     */
    configuration(name: string) {
        name = name || this.getDefaultConnection();
        const connections = lodash.get(this.$app['config'], 'database.connections', {})

        if (!connections[name]) {
            throw new Error(`Database connection [${name}] not configured.`);
        }

        return new ConfigurationUrlParser().parseConfiguration(connections[name]);
    }

    /**
     * configure method.
     * @param {*} connection
     * @param {*} type
     * @returns {any}
     */
    configure(connection: any, type?: string) {
        if (connection && typeof connection.setReconnector === 'function') {
            connection.setReconnector(this.$reconnector);
        }

        return connection;
    }

    /**
     * purge method.
     * @param {*} $name
     * @returns {any}
     */
    purge($name: any = null) {
        $name = $name || this.getDefaultConnection();

        this.disconnect($name);

        delete this.$connections[$name];
    }


    /**
     * disconnect method.
     * @param {*} $name
     * @returns {any}
     */
    disconnect($name: any = null) {
        $name = $name || this.getDefaultConnection();
        if (isset(this.$connections[$name])) {
            this.$connections[$name].disconnect();
        }
    }

    /**
     * reconnect method.
     * @param {*} $name
     * @returns {any}
     */
    reconnect($name: any = null) {
        $name = $name || this.getDefaultConnection();
        this.disconnect($name);

        if (!isset(this.$connections[$name])) {
            return this.connection($name);
        }

        return this.refreshConnections($name);
    }

    /**
     * refreshConnections method.
     * @param {*} $name
     * @returns {any}
     */
    refreshConnections($name: string) {
        return this.$connections[$name] = this.configure(
            this.makeConnection($name)
        );
    }

    /**
     * usingConnection method.
     * @param {*} $name
     * @param {*} $callback
     * @returns {any}
     */
    usingConnection($name: string, $callback: Function) {
        const $previousName = this.getDefaultConnection();

        this.setDefaultConnection($name);

        return tap($callback(), () => {
            this.setDefaultConnection($previousName);
        });
    }

    /**
     * getDefaultConnection method.
     * @returns {any}
     */
    getDefaultConnection() {
        return lodash.get(this.$app['config'], 'database.default');
    }

    /**
     * setDefaultConnection method.
     * @param {*} $name
     * @returns {any}
     */
    setDefaultConnection($name: string) {
        lodash.set(this.$app['config'], 'database.default', $name);
    }

    /**
     * supportedDrivers method.
     * @returns {any}
     */
    supportedDrivers() {
        return ['mysql', 'pgsql', 'sqlite', 'sqlsrv', 'oracle'];
    }

    /**
     * extend method.
     * @param {*} $name
     * @param {*} $resolver
     * @returns {any}
     */
    extend($name: string, $resolver: any) {
        this.$extensions[$name] = $resolver;
    }

    /**
     * forgetExtension method.
     * @param {*} $name
     * @returns {any}
     */
    forgetExtension($name: string) {
        delete this.$extensions[$name];
    }
    /**
     * getConnections method.
     * @returns {any}
     */
    getConnections() {
        return this.$connections;
    }

    /**
     * setReconnector method.
     * @param {*} $reconnector
     * @returns {any}
     */
    setReconnector($reconnector: any) {
        this.$reconnector = $reconnector;
    }

    /**
     * getPrefix method.
     * @returns {any}
     */
    getPrefix() {
        return this.getConfig(`prefix`);
    }

    /**
     * getConfig method.
     * @param {*} name
     * @returns {any}
     */
    getConfig(name: string) {
        return lodash.get(this.$app['config'], `database.connections.${name}`);
    }

    /**
     * registerCommands method.
     * @param {*} dir
     * @returns {any}
     */
    registerCommands(dir: any) {
        const container = this.$container || this.$app;
        if (container && container.console && typeof container.console.load == 'function' && !env('production')) {
            container.console.load(dir);
        }
    }
    /**
     * __call method.
     * @param {*} $target
     * @param {*} $method
     * @param {*} $parameters
     * @returns {any}
     */
    __call($target: Record<string, any>, $method: string, $parameters: any[]) {
        return $target.connection()[$method](...$parameters);
    }

}

export default DatabaseManager;
