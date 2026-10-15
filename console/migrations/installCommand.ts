const Command = require('@ostro/console/command')
/**
 * Class InstallCommand.
 */
class InstallCommand extends Command {

    $signature = 'migrate:install';

    $description = 'Create the migration repository';

    $options = [
        this.createOption('--database [database]', 'The database connection to use'),
    ];

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

module.exports = InstallCommand