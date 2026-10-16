const Command = require('@ostro/console/command')
/**
 * Class DatabaseQuery.
 */
class DatabaseQuery extends Command {

    /**
     * Create a new instance.
     * @param {*} resolver
     */
    constructor(resolver: any) {
        super()
        this.$resolver = resolver;
    }

    $signature = 'db:query';

    $arguments = [
        this.createArgument('<query>', 'database query string').required()
    ];

    $description = 'database query';

    /**
     * handle method.
     * @returns {any}
     */
    handle() {
        return this.$resolver.connection().raw(this.input.argument('query')).then(res => {
            console.log(res)
        })

    }

}

export default DatabaseQuery;