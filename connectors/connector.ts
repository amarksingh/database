
const DetectsLostConnections = require('@ostro/database/detectsLostConnections')
/**
 * Class Connector.
 */
class Connector extends DetectsLostConnections {

    $options = {};

    /**
     * createConnection method.
     * @param {*} $dsn
     * @param {*} $config
     * @param {*} $options
     * @returns {any}
     */
    createConnection($dsn: any, $config: Record<string, any>, $options: Record<string, any>) {
        const $username = $config['username'] || null;
        const $password = $config['password'] || null;

        try {
            return this.createConnection(
                $dsn, $username, $password, $options
            );
        } catch ($e) {
            return this.tryAgainIfCausedByLostConnection(
                $e, $dsn, $username, $password, $options
            );
        }
    }

    /**
     * createConnection method.
     * @param {*} $dsn
     * @param {*} $username
     * @param {*} $password
     * @param {*} $options
     * @returns {any}
     */
    createConnection($dsn: any, $username: any, $password: string, $options: Record<string, any>) {
        return new PDO($dsn, $username, $password, $options);
    }

    /**
     * tryAgainIfCausedByLostConnection method.
     * @param {*} $e
     * @param {*} $dsn
     * @param {*} $username
     * @param {*} $password
     * @param {*} $options
     * @returns {any}
     */
    tryAgainIfCausedByLostConnection($e: any, $dsn: any, $username: any, $password: string, $options: Record<string, any>) {
        if (this.causedByLostConnection($e)) {
            return this.createConnection($dsn, $username, $password, $options);
        }

        throw $e;
    }

    /**
     * getDefaultOptions method.
     * @returns {any}
     */
    getDefaultOptions() {
        return this.$options;
    }

    /**
     * setDefaultOptions method.
     * @param {*} $options
     * @returns {any}
     */
    setDefaultOptions($options: Record<string, any>) {
        this.$options = $options;
    }
}
module.exports = Connector