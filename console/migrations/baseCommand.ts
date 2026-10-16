import Command from '@ostro/console/command';

/**
 * Class BaseCommand.
 */
class BaseCommand extends Command {

    /**
     * getMigrationPaths method.
     * @returns {any}
     */
    getMigrationPaths() {

        if (this.input.hasOption('path') && this.option('path')) {
            return collect(this.option('path').split(',')).map(($path) => {
                return !this.usingRealPath() ?
                    this.$app.basePath($path) :
                    $path;
            }).all();
        }

        return this.$migrator.paths().concat([this.getMigrationPath()])
    }

    /**
     * usingRealPath method.
     * @returns {any}
     */
    usingRealPath() {
        return this.input.hasOption('realpath') && this.option('realpath');
    }

    /**
     * getMigrationPath method.
     * @returns {any}
     */
    getMigrationPath() {
        return this.$app.databasePath('migrations');
    }
}

export default BaseCommand;