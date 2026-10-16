import Command from '@ostro/console/command';
/**
 * Class InstallCommand.
 */
class InstallCommand extends Command {
    [key: string]: any;

    get $signature(): string {
        return 'migrate:install';
    }

    get $description(): string {
        return 'Create the migration repository';
    }

    get $options(): any[] {
        return [
        this.createOption('--database [database]', 'The database connection to use'),
    ];
    }

    /**
     * Create a new instance.
     * @param {*} $repository
     */
    constructor($repository: any) {
        super()

        this.$repository = $repository;
    }

    /**
     * handle method.
     * @returns {any}
     */
    handle() {
        this.$repository.setSource(this.input.getOption('database'));

        return this.$repository.createRepository().then(res => {
            this.info('Migration table created successfully.');
        })

    }

}

export default InstallCommand;