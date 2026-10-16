const path = require('path')
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException')
const { dirname, date } = require('@ostro/support/function')
const { pascal } = require('@ostro/support/string')

/**
 * Class MigrationCreator.
 */
class MigrationCreator {

    $postCreate = [];

    /**
     * Create a new instance.
     * @param {*} $files
     */
    constructor($files: any) {
        this.$files = $files;
    }

    /**
     * create method.
     * @async
     * @param {*} $name
     * @param {*} $path
     * @param {*} $table
     * @param {*} $create
     * @returns {any}
     */
    async create($name: string, $path: string, $table: any = null, $create: boolean = false) {
        await this.ensureMigrationDoesntAlreadyExist($name, $path);

        let $stub = await this.getStub($table, $create);

        $path = this.getPath($name, $path);

        await this.$files.ensureDirectoryExists(dirname($path));

        await this.$files.put(
            $path,
            await this.populateStub($name, $stub, $table)
        );

        this.firePostCreateHooks($table);

        return $path;
    }

    /**
     * ensureMigrationDoesntAlreadyExist method.
     * @async
     * @param {*} $name
     * @param {*} $migrationPath
     * @returns {any}
     */
    async ensureMigrationDoesntAlreadyExist($name: string, $migrationPath: any = null) {
        let classes = []
        if (await this.$files.exists($migrationPath)) {
            let $migrationFiles = await this.$files.glob(path.join($migrationPath, '/*.js'));

            for (let $migrationFile of $migrationFiles) {
                classes.push(await this.$files.requireOnce($migrationFile).then(res => res.name));
            }
        }
        let $className = this.getClassName($name)
        if (classes.indexOf($className) > -1) {
            throw new InvalidArgumentException(`Unable to create migration. A ${$className} class already exists.`);
        }
    }

    /**
     * getStub method.
     * @async
     * @param {*} $table
     * @param {*} $create
     * @returns {any}
     */
    async getStub($table: string, $create: any) {
        let $stub = ''
        if ($table == null) {
            let $customPath = path.join(__dirname, '/migration')
            $stub = await this.$files.exists($customPath) ?
                $customPath :
                this.stub('/migration.stub');
        } else if ($create) {
            let $customPath = path.join(__dirname, '/migration.create.stub')
            $stub = await this.$files.exists() ?
                $customPath :
                this.stub('/migration.create.stub');
        } else {
            let $customPath = path.join(__dirname, '/migration.update.stub')
            $stub = await this.$files.exists() ?
                $customPath :
                this.stub('/migration.update.stub');
        }

        return this.$files.get($stub);
    }

    /**
     * populateStub method.
     * @param {*} $name
     * @param {*} $stub
     * @param {*} $table
     * @returns {any}
     */
    populateStub($name: string, $stub: any, $table: string) {
        $name = this.getClassName($name)
        $stub = $stub.replaceAll('DummyClass', $name).replaceAll('{{ class }}', $name).replaceAll('{{class}}', $name)

        if ($table != null) {
            $stub = $stub.replaceAll('DummyTable', $table).replaceAll('{{ table }}', $table).replaceAll('{{table}}', $table)
        }

        return $stub;
    }

    /**
     * getClassName method.
     * @param {*} $name
     * @returns {any}
     */
    getClassName($name: string) {
        return pascal($name);
    }

    /**
     * getPath method.
     * @param {*} $name
     * @param {*} $path
     * @returns {any}
     */
    getPath($name: string, $path: string) {
        return path.join($path, (this.getDatePrefix() + '_' + $name + '.js'));
    }

    /**
     * firePostCreateHooks method.
     * @param {*} $table
     * @returns {any}
     */
    firePostCreateHooks($table: string) {
        for (let $callback of this.$postCreate) {
            $callback($table);
        }
    }

    /**
     * afterCreate method.
     * @param {*} $callback
     * @returns {any}
     */
    afterCreate($callback: Function) {
        this.$postCreate.push($callback);
    }

    /**
     * getDatePrefix method.
     * @returns {any}
     */
    getDatePrefix() {
        return date('yyyy_MM_dd_hhmmss');
    }

    /**
     * stub method.
     * @param {*} $stub
     * @returns {any}
     */
    stub($stub: any) {
        return path.join(__dirname, 'stubs', $stub);
    }

    /**
     * getFilesystem method.
     * @returns {any}
     */
    getFilesystem() {
        return this.$files;
    }
}

export default MigrationCreator;