const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException')
const { get_class_name } = require('@ostro/support/function')
const kCommand = Symbol('command')
/**
 * Class Seeder.
 */
class Seeder {

    get $command() {
        return this[kCommand] = this[kCommand] || null
    };

    set $command(value) {
        return this[kCommand] = value
    };

    /**
     * Create a new instance.
     * @param {*} $resolver
     */
    constructor($resolver) {
        this.$resolver = $resolver
    }

    /**
     * call method.
     * @async
     * @param {*} $classes
     * @param {*} $silent
     * @param {*} $parameters
     * @returns {any}
     */
    async call($classes, $silent = false, $parameters = []) {
        $classes = Array.isArray($classes) ? $classes : [$classes];

        for (let $class of $classes) {
            let $seeder = this.resolve($class);

            let $name = get_class_name($seeder);
            if ($silent === false && this.$command) {
                this.$command.getOutput().writeln(`<comment>Seeding:</comment> ${$name}`);
            }

            let $startTime = Date.now();
            await $seeder.__invoke($parameters);

            let $runTime = Number((Date.now() - $startTime) * 1000, 2);

            if ($silent === false && this.$command) {
                this.$command.getOutput().writeln(`<info>Seeded:</info>  ${$name} (${$runTime}ms)`);
            }
        }

        return this;
    }

    /**
     * callWith method.
     * @param {*} $class
     * @param {*} $parameters
     * @returns {any}
     */
    callWith($class, $parameters = []) {
        return this.call($class, false, $parameters);
    }

    /**
     * callSilent method.
     * @param {*} $class
     * @param {*} $parameters
     * @returns {any}
     */
    callSilent($class, $parameters = []) {
        return this.call($class, true, $parameters);
    }

    /**
     * resolve method.
     * @param {*} $class
     * @returns {any}
     */
    resolve($class) {

        let $instance
        if (this.$app) {
            $instance = this.$app.make($class);

            $instance.setContainer(this.$app);
        } else {
            $instance = new $class;
        }

        if (this.$command) {
            $instance.setCommand(this.$command);
        }

        return $instance;
    }

    /**
     * setContainer method.
     * @param {*} app
     * @returns {any}
     */
    setContainer(app) {
        this.$app = app;

        return this;
    }

    /**
     * setCommand method.
     * @param {*} $command
     * @returns {any}
     */
    setCommand($command) {
        this.$command = $command;

        return this;
    }

    /**
     * __invoke method.
     * @param {*} $parameters
     * @returns {any}
     */
    __invoke($parameters = []) {
        if (!this['run']) {
            throw new InvalidArgumentException('Method [run] missing from ' + get_class_name(this));
        }

        return this.$app ?
            this.$app.call([this, 'run'], $parameters) :
            this.run(...$parameters);
    }
}

module.exports = Seeder