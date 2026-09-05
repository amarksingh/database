const Collection = require('@ostro/support/collection')
const { count, collect, get_class_name } = require('@ostro/support/function')
const fs = require('fs-extra')
const path = require('path');

class Migrator {

    $paths = [];

    $output = null;

    constructor($repository, $resolver, $file) {

        this.$repository = $repository;
        this.$resolver = $resolver;
        this.$file = $file;

    }

    run($paths = [], $options = []) {

        return this.getMigrationFiles($paths).then($files => {

            return this.$repository.getRan().then(async (res) => {
                let $migrations = await this.pendingMigrations($files, res)
                return this.runPending($migrations, $options)
            })

        })

    }

    pendingMigrations($files, $ran) {

        return Collection.make($files)
            .differenceWith($ran, (file, compare) => {
                return this.getMigrationName(file) == compare
            }).values().all();
    }

    async runPending($migrations, $options = []) {

        if ($migrations.length === 0) {

            this.note('<info>Nothing to migrate.</info>');

            return;
        }

        let $batch = await this.$repository.getNextBatchNumber();

        let $pretend = $options['pretend'] ? $options['pretend'] : false;

        let $step = $options['step'] ? $options['step'] : false;
        for (let $file of $migrations) {

            await this.runUp($file, $batch, $pretend);
            if ($step) {
                $batch++;
            }
        }

    }

    async runUp($file, $batch, $pretend) {

        let $migration = this.resolvePath($file);

        let $name = this.getMigrationName($file);

        if ($pretend) {
            return await this.pretendToRun($migration, 'up');
        }
        this.note(`<comment>Migrating:</comment> ${$name}`);

        let $startTime = Date.now();

        await this.runMigration($migration, 'up');

        let $runTime = Number((Date.now() - $startTime));

        await this.$repository.log($name, $batch);

        this.note(`<info>Migrated:</info>  ${$name} (${$runTime}ms)`);
    }

    async rollback($paths = [], $options = []) {

        let $migrations = await this.getMigrationsForRollback($options);
        if ($migrations.length === 0) {

            this.note('<info>Nothing to rollback.</info>');

            return [];
        }

        return this.rollbackMigrations($migrations, $paths, $options);
    }

    async getMigrationsForRollback($options = []) {
        let $steps = $options['step'] ? $options['step'] : 0
        if ($steps > 0) {
            return await this.$repository.getMigrations($steps);
        }

        return this.$repository.getLast();
    }

    async rollbackMigrations($migrations, $paths, $options) {
        let $rolledBack = [];
        let $files = await this.getMigrationFiles($paths)

        for (let $migration of $migrations) {

            let $file = $files.find((content) => this.getMigrationName(content) == $migration.migration)
            if (!$file) {
                this.note(`<fg=red>Migration not found:</> ${$migration.migration}`);

                continue;
            }

            $rolledBack.push($file);

            await this.runDown(
                $file, $migration,
                $options['pretend'] ? $options['pretend'] : false
            );
        }

        return $rolledBack;
    }

    async reset($paths = [], $pretend = false) {

        let $migrations = (await this.$repository.getRan()).reverse();
        if (count($migrations) === 0) {
            this.note('<info>Nothing to rollback.</info>');

            return [];
        }

        return this.resetMigrations($migrations, $paths, $pretend);
    }

    async resetMigrations($migrations, $paths, $pretend = false) {

        $migrations = collect($migrations).map(function ($m) {
            return {
                'migration': $m
            };
        }).all();

        return await this.rollbackMigrations(
            $migrations, $paths, { $pretend }
        );
    }

    async runDown($file, $migration, $pretend) {

        let $instance = this.resolvePath($file);

        this.note(`<comment>Rolling back:</comment> ${$migration.migration}`);

        if ($pretend) {
            return await this.pretendToRun($instance, 'down');
        }

        let $startTime = Date.now();

        await this.runMigration($instance, 'down');

        let $runTime = Number((Date.now() - $startTime));

        await this.$repository.delete($migration);

        this.note(`<info>Rolled back:</info>  ${$migration.migration} (${$runTime}ms)`);
    }

    async runMigration($migration, $method) {
        let $connection = this.resolveConnection(typeof $migration.getConnection === 'function' ? $migration.getConnection() : null);
        if (typeof $migration[$method] == 'function') {
            await $migration[$method]($connection ? $connection.getSchemaBuilder() : null, $connection);
        }

    }

    async pretendToRun($migration, $method) {
        try {
            let $queries = await this.getQueries($migration, $method);
            for (let $query of $queries) {
                let $name = get_class_name($migration);

                this.note(`<info>${$name}:</info> ${$query['query']}`);
            }
        } catch ($e) {
            let $name = get_class_name($migration);

            this.note(`<info>${$name}:</info> failed to dump queries. This may be due to changing database columns using Doctrine, which is not supported while pretending to run migrations.`);
        }
    }

    getQueries($migration, $method) {
        let $db = this.resolveConnection(
            $migration.getConnection()
        );

        return $db.pretend(function () {
            if (typeof $migration[$method] === 'function') {
                $migration[$method]();
            }
        });
    }

    resolve($file) {
        let $class = this.getMigrationClass($file);

        return typeof $class === 'function' ? new $class : $class;
    }

    resolvePath($path) {
        const resolved = require.resolve($path);
        delete require.cache[resolved];

        let $migration = require($path);

        return typeof $migration == 'object' ? $migration : new $migration;
    }

    getMigrationClass($migrationName) {

    }

    async getMigrationFiles($paths) {
        let datas = Collection.make($paths).flatMap(async ($path) => {
            return $path.endsWith('.js') ? [$path] : this.$file.glob($path + path.sep + '*_*.js')
        }).all()
        return Promise.all(datas).then(files => {
            return Collection.make(files).filter().values().flatten().sortBy(($file, $key) => {
                return $key;
            }).all()
        })

    }

    requireFiles($files = []) {
        for (var i = 0; i < $files.length; i++) {
            $files[i] = fs.readFile($files[i]).then(res => res.toString());
        }
        return Promise.allSettled($files)

    }

    getMigrationName($path = '') {

        return path.basename($path)

    }

    paths() {
        return this.$paths;
    }

    getConnection() {
        return this.connection;
    }

    usingConnection($name) {
        return Promise.resolve(this.resolveConnection($name))

    }

    setConnection($name) {
        this.connection = $name;
    }

    resolveConnection($connection) {
        return this.$resolver.connection($connection || this.connection);
    }

    getRepository() {
        return this.$repository;
    }

    repositoryExists() {
        return this.$repository.repositoryExists();
    }

    hasRunAnyMigrations() {
        return this.repositoryExists().then(res => {
            if (res == true) {
                return this.$repository.getRan()
            }
        })
    }

    deleteRepository() {
        return this.$repository.deleteRepository();
    }

    getFilesystem() {
        return this.$file;
    }

    setOutput($output) {
        this.$output = $output;
        return this;
    }

    note($message) {
        if (this.$output) {
            this.$output.writeln($message);
        }
    }

}

module.exports = Migrator
