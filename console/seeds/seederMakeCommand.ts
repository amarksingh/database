const { trim } = require("@ostro/support/helpers");
declare var isDirectory: any;
import GeneratorCommand from '@ostro/console/generatorCommand';
import path from 'path';
/**
 * Class MakeSeederCommand.
 */
class MakeSeederCommand extends GeneratorCommand {
    [key: string]: any;

    public get $signature(): string {
        return 'make:seeder';
    }

    public get $description(): string {
        return 'Create a new seeder class';
    }

    public get $arguments(): any[] {
        return [
        this.createArgument('<name>', 'Class name for seed').required()
    ];
    }

    $type = 'Seeder';

    /**
     * getStub method.
     * @returns {any}
     */
    public getStub() {
        return this.resolveStubPath('/stubs/seeder.stub');
    }

    /**
     * resolveStubPath method.
     * @param {*} $stub
     * @returns {any}
     */
    public resolveStubPath($stub: any) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

    /**
     * getPath method.
     * @async
     * @param {*} $name
     * @returns {any}
     */
    public async getPath($name: string) {
        if (await isDirectory(this.$app.databasePath('/seeds'))) {
            return this.$app.databasePath('seeds/' + (this.getFileName($name) as any).camelCase() + '.js');
        } else {
            return this.$app.databasePath('seeders/' + (this.getFileName($name) as any).camelCase() + '.js');
        }
    }

    /**
     * qualifyClass method.
     * @param {*} $name
     * @returns {any}
     */
    public qualifyClass($name: string) {
        return $name;
    }
}

export default MakeSeederCommand;