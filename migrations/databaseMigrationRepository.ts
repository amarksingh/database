/**
 * Class DatabaseMigrationRepository.
 */
class DatabaseMigrationRepository {
    $resolver;
    $table;
    $connection;
    /**
     * Create a new instance.
     * @param {*} $resolver
     * @param {*} $table
     */
    constructor($resolver: any, $table: string) {
        this.$resolver = $resolver;
        this.$table = $table;
    }

    /**
     * getRan method.
     * @returns {any}
     */
    getRan() {
        return this.table()
            .orderBy('batch', 'asc')
            .orderBy('migration', 'asc')
            .pluck('migration')
    }

    /**
     * getMigrations method.
     * @param {*} $steps
     * @returns {any}
     */
    getMigrations($steps: any) {
        return this.table()
            .where('batch', '>=', '1')
            .orderBy('batch', 'desc')
            .orderBy('migration', 'desc')
            .take($steps)
            .get();
    }

    /**
     * getLast method.
     * @async
     * @returns {any}
     */
    async getLast() {
        const lastBatch = await this.getLastBatchNumber();
        return this.table()
            .where('batch', lastBatch)
            .orderBy('migration', 'desc')
            .get();
    }

    /**
     * getMigrationBatches method.
     * @returns {any}
     */
    getMigrationBatches() {
        return this.table()
            .orderBy('batch', 'asc')
            .orderBy('migration', 'asc')
            .pluck('batch', 'migration')
    }

    /**
     * log method.
     * @param {*} $file
     * @param {*} $batch
     * @returns {any}
     */
    log($file: any, $batch: any) {
        return this.table().insert({ 'migration': $file, 'batch': $batch })
    }

    /**
     * delete method.
     * @param {*} $migration
     * @returns {any}
     */
    delete($migration: any) {
        return this.table().where('migration', $migration.migration).delete();
    }

    /**
     * getNextBatchNumber method.
     * @async
     * @returns {any}
     */
    async getNextBatchNumber() {
        return (await this.getLastBatchNumber()) + 1;
    }

    /**
     * getLastBatchNumber method.
     * @async
     * @returns {any}
     */
    async getLastBatchNumber() {
        const res = await this.table().max('batch as batch');
        if (!res || !res.length) return 0;
        const val = Object.values(res[0])[0];
        return Number(val) || 0;
    }

    /**
     * createRepository method.
     * @returns {any}
     */
    createRepository() {
        let $schema = this.getConnection().getSchemaBuilder();

        return $schema.createTable(this.$table, function ($table) {
            $table.increments('id');
            $table.string('migration');
            $table.integer('batch');
        });
    }

    /**
     * repositoryExists method.
     * @returns {any}
     */
    repositoryExists() {
        let $schema = this.getConnection().getSchemaBuilder();
        return $schema.hasTable(this.$table)
    }

    /**
     * deleteRepository method.
     * @returns {any}
     */
    deleteRepository() {
        let $schema = this.getConnection().getSchemaBuilder();

        return $schema.dropTable(this.$table);
    }

    /**
     * table method.
     * @returns {any}
     */
    table() {
        return this.getConnection().table(this.$table);
    }

    /**
     * getConnectionResolver method.
     * @returns {any}
     */
    getConnectionResolver() {
        return this.$resolver;
    }

    /**
     * getConnection method.
     * @returns {any}
     */
    getConnection() {
        return this.getConnectionResolver().connection(this.$connection);
    }

    /**
     * setSource method.
     * @param {*} $name
     * @returns {any}
     */
    setSource($name: string) {
        this.$connection = $name;
    }
}

export default DatabaseMigrationRepository;
