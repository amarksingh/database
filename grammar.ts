/**
 * Class Grammar.
 */
class Grammar {

    $connection;

    $tablePrefix = '';

    /**
     * getDateFormat method.
     * @returns {any}
     */
    getDateFormat() {
        return 'Y-m-d H:i:s';
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
    setTablePrefix($prefix: any) {
        this.$tablePrefix = $prefix;

        return this;
    }

    /**
     * setConnection method.
     * @param {*} $connection
     * @returns {any}
     */
    setConnection($connection: any) {
        this.$connection = $connection;

        return this;
    }

}

module.exports = Grammar;