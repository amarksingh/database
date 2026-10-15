const { get_class_name, count } = require("@ostro/support/function");
const ModelNotFoundExceptionContracts = require("@ostro/contracts/database/eloquent/modelNotFoundException");

/**
 * Class ModelNotFoundException.
 */
class ModelNotFoundException extends ModelNotFoundExceptionContracts {
    $model;

    $ids;

    /**
     * Create a new instance.
     */
    constructor() {
        super();
        this.name = this.constructor.name;
        this.code = 'ERR_INVALID_ARG_VALUE';
        this.statusCode = 500

    }


    /**
     * setModel method.
     * @param {*} $model
     * @param {*} $ids
     * @returns {any}
     */
    setModel($model: any, $ids: any[] = []) {
        this.$model = $model;
        this.$ids = $ids;

        this.message = `No query results for model [${get_class_name($model)}]`;

        if (count(this.$ids) > 0) {
            this.message += ' ' + this.$ids.join(', ');
        } else {
            this.message += '.';
        }

        return this;
    }

    /**
     * getModel method.
     * @returns {any}
     */
    getModel() {
        return this.$model;
    }

    /**
     * getIds method.
     * @returns {any}
     */
    getIds() {
        return this.$ids;
    }
}

module.exports = ModelNotFoundException
