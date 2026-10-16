import BaseCommand from './baseCommand';
import TableGuesser from './tableGuesser';
import path from 'path';
import InvalidArgumentException from '@ostro/contracts/exception/invalidArgumentException';
/**
 * Class CreateSchema.
 */
class CreateSchema extends BaseCommand {

    /**
     * Create a new instance.
     * @param {*} $creator
     */
    constructor($creator: any) {
        super()
        this.$creator = $creator;
    }

    $signature = 'make:migration';

    $description = 'Create a new migration file';

    $options = [
        this.createOption('--database', 'The database connection to use'),
        this.createOption('--create [create]', 'The table to be created'),
        this.createOption('--table [table]', 'The table to migrate'),
        this.createOption('--path', 'The location where the migration file should be created'),
        this.createOption('--relativepath [path] ', 'The location where the migration file should be created'),
        this.createOption('--realpath', 'Indicate any provided migration file paths are pre-resolved absolute paths'),
        this.createOption('--fullpath', 'Output the full path of the migration'),
    ];

    get $arguments() {
        return [
            this.createArgument('name', 'The name of the migration').required()
        ]
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    async handle() {

        let $name = this.input.getArgument('name');
        let $path = this.input.getOption('path')
        let $table = this.input.getOption('table');

        let $create = this.input.getOption('create') || false;

        if (!$table && String.isString($create)) {
            $table = $create;

            $create = true;
        }

        if (!$table) {
            [$table, $create] = TableGuesser.guess($name);
        }

        try {
            await this.writeMigration($name, $table, $create);
        } catch (err) {
            if (err instanceof Error) {
                this.line(err.message)
            }
        }

    }

    /**
     * writeMigration method.
     * @async
     * @param {*} $name
     * @param {*} $table
     * @param {*} $create
     * @returns {any}
     */
    async writeMigration($name: string, $table: string, $create: any) {
        let $file = await this.$creator.create(
            $name.plural().camelCase().snakeCase(), this.getMigrationPath(), $table, $create
        );

        if (!this.option('fullpath')) {

        }

        this.line(`<info>Created Migration:</info> ${$file.replace(this.getMigrationPath(), '').slice(1)}`);
    }

    /**
     * getMigrationPath method.
     * @returns {any}
     */
    getMigrationPath() {
        let $targetPath = this.input.getOption('path')
        if ($targetPath != null) {
            return !this.usingRealPath() ? this.$app.basePath($targetPath) : $targetPath;
        }

        return super.getMigrationPath();
    }
}

export default CreateSchema;