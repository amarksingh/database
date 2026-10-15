const { get_class_name } = require('@ostro/support/function');
/**
 * Class RelationNotFoundException.
 */
class RelationNotFoundException {
    /**
     * Create a new instance.
     * @param {*} message
     */
    constructor(message: string) {
        this.name = this.constructor.name;
        this.code = 'ERR_INVALID_ARG_VALUE';
        this.message = message || 'Invalid Argument';
        this.statusCode = 500
        Error.captureStackTrace(this, this.constructor);
    }


    /**
     * make method.
     * @static
     * @param {*} $model
     * @param {*} $relation
     * @returns {any}
     */
    static make($model: any, $relation: any) {
        let $class = get_class_name($model);

        let $instance = new this(`Call to undefined relationship [${$relation}] on model [${$class}].`);

        $instance.$model = $class;
        $instance.$relation = $relation;

        return $instance;
    }
}

module.exports = RelationNotFoundException