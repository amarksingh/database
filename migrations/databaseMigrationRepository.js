class DatabaseMigrationRepository {
    $resolver;
    $table;
    $connection;
    constructor($resolver, $table) {
        this.$resolver = $resolver;
        this.$table = $table;
    }

    getRan() {
        return this.table()
            .orderBy('batch', 'asc')
            .orderBy('migration', 'asc')
            .pluck('migration')
    }

    getMigrations($steps) {
        return this.table()
            .where('batch', '>=', '1')
            .orderBy('batch', 'desc')
            .orderBy('migration', 'desc')
            .take($steps)
            .get();
    }

    async getLast() {
        const lastBatch = await this.getLastBatchNumber();
        return this.table()
            .where('batch', lastBatch)
            .orderBy('migration', 'desc')
            .get();
    }

    getMigrationBatches() {
        return this.table()
            .orderBy('batch', 'asc')
            .orderBy('migration', 'asc')
            .pluck('batch', 'migration')
    }

    log($file, $batch) {
        return this.table().insert({ 'migration': $file, 'batch': $batch })
    }

    delete($migration) {
        return this.table().where('migration', $migration.migration).delete();
    }

    async getNextBatchNumber() {
        return (await this.getLastBatchNumber()) + 1;
    }

    async getLastBatchNumber() {
        const res = await this.table().max('batch as batch');
        if (!res || !res.length) return 0;
        const val = Object.values(res[0])[0];
        return Number(val) || 0;
    }

    createRepository() {
        let $schema = this.getConnection().getSchemaBuilder();

        return $schema.createTable(this.$table, function ($table) {
            $table.increments('id');
            $table.string('migration');
            $table.integer('batch');
        });
    }

    repositoryExists() {
        let $schema = this.getConnection().getSchemaBuilder();
        return $schema.hasTable(this.$table)
    }

    deleteRepository() {
        let $schema = this.getConnection().getSchemaBuilder();

        return $schema.dropTable(this.$table);
    }

    table() {
        return this.getConnection().table(this.$table);
    }

    getConnectionResolver() {
        return this.$resolver;
    }

    getConnection() {
        return this.getConnectionResolver().connection(this.$connection);
    }

    setSource($name) {
        this.$connection = $name;
    }
}

module.exports = DatabaseMigrationRepository
