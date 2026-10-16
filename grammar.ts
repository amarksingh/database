/**
 * Class Grammar.
 */
class Grammar {
    $connection: any;

    $tablePrefix: string = '';

    /**
     * Get the format for database stored dates.
     *
     * @returns Date format string.
     */
    getDateFormat(): string {
        return 'Y-m-d H:i:s';
    }

    /**
     * Get the grammar's table prefix.
     *
     * @returns Table prefix.
     */
    getTablePrefix(): string {
        return this.$tablePrefix;
    }

    /**
     * Set the grammar's table prefix.
     *
     * @param prefix - Table prefix.
     * @returns Fluent self instance.
     */
    setTablePrefix(prefix: string): this {
        this.$tablePrefix = prefix;

        return this;
    }

    /**
     * Set the grammar's database connection.
     *
     * @param connection - Connection instance.
     * @returns Fluent self instance.
     */
    setConnection(connection: any): this {
        this.$connection = connection;

        return this;
    }
}

export default Grammar;