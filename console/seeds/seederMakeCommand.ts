import GeneratorCommand from '@ostro/console/generatorCommand';
import path from 'path';
/**
 * Class MakeSeederCommand.
 */
class MakeSeederCommand extends GeneratorCommand {

    $signature = 'make:seeder';

    $description = 'Create a new seeder class';

    $arguments = [
        this.createArgument('<name>', 'Class name for seed').required()
    ];

    $type = 'Seeder';

    /**
     * getStub method.
     * @returns {any}
     */
    getStub() {
        return this.resolveStubPath('/stubs/seeder.stub');
    }

    /**
     * resolveStubPath method.
     * @param {*} $stub
     * @returns {any}
     */
    resolveStubPath($stub: any) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

    /**
     * getPath method.
     * @async
     * @param {*} $name
     * @returns {any}
     */
    async getPath($name: string) {
        if (await isDirectory(this.$app.databasePath('/seeds'))) {
            return this.$app.databasePath('seeds/' + this.getFileName($name).camelCase() + '.js');
        } else {
            return this.$app.databasePath('seeders/' + this.getFileName($name).camelCase() + '.js');
        }
    }

    /**
     * qualifyClass method.
     * @param {*} $name
     * @returns {any}
     */
    qualifyClass($name: string) {
        return $name;
    }
}

export default MakeSeederCommand;