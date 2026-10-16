import Command from '@ostro/console/command';

/**
 * Class RefreshCommand.
 */
class RefreshCommand extends Command {

    $signature = 'migrate:refresh';

    $description = 'Reset and re-run all migrations';

    $options = [
        this.createOption('--database [database]', 'The database connection to use'),
        this.createOption('--force', 'Force the operation to run when in production'),
        this.createOption('--path', 'The path(s) to the migrations files to be executed'),
        this.createOption('--realpath', 'Indicate any provided migration file paths are pre-resolved absolute paths'),
        this.createOption('--seed', 'Indicates if the seed task should be re-run'),
        this.createOption('--seeder', 'The class name of the root seeder'),
        this.createOption('--step', 'Force the migrations to be run so they can be rolled back individually'),
    ];

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    async handle() {
        if (!this.input.getOption('force') && !await this.confirmToProceed()) {
            return 1;
        }

        let $database = this.input.getOption('database');

        let $path = this.input.getOption('path');

        let $step = this.input.getOption('step') || 1;

        if ($step > 1) {
            await this.runRollback($database, $path, $step);
        } else {
            await this.runReset($database, $path);
        }

        await this.callCommand('migrate', Object.filter({
            '--database': $database,
            '--path': $path,
            '--realpath': this.input.getOption('realpath'),
            '--force': true,
        }));

        if (this.needsSeeding()) {
            this.runSeeder($database);
        }

        return 0;
    }

    /**
     * runRollback method.
     * @param {*} $database
     * @param {*} $path
     * @param {*} $step
     * @returns {any}
     */
    runRollback($database: any, $path: string, $step: any) {
        return this.callCommand('migrate:rollback', Object.filter({
            '--database': $database,
            '--path': $path,
            '--realpath': this.input.getOption('realpath'),
            '--step': $step,
            '--force': true,
        }));
    }

    /**
     * runReset method.
     * @param {*} $database
     * @param {*} $path
     * @returns {any}
     */
    runReset($database: any, $path: string) {
        return this.callCommand('migrate:reset', Object.filter({
            '--database': $database,
            '--path': $path,
            '--realpath': this.input.getOption('realpath'),
            '--force': true,
        }));
    }

    /**
     * needsSeeding method.
     * @returns {any}
     */
    needsSeeding() {
        return this.option('seed') || this.option('seeder');
    }

    /**
     * runSeeder method.
     * @param {*} $database
     * @returns {any}
     */
    runSeeder($database: any) {
        return this.callCommand('db:seed', Object.filter({
            '--database': $database,
            '--class': this.option('seeder') || 'database/seeders/databaseSeeder',
            '--force': true,
        }));
    }

}

export default RefreshCommand;