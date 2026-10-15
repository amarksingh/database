const { last } = require('@ostro/support/function');

/**
 * Class CanBeOneOfMany.
 */
class CanBeOneOfMany {

    $isOneOfMany = false;

    /**
     * getRelationQuery method.
     * @returns {any}
     */
    getRelationQuery() {
        return this.isOneOfMany() ?
            this.$oneOfManySubQuery :
            this.$query;
    }

    /**
     * getOneOfManySubQuery method.
     * @returns {any}
     */
    getOneOfManySubQuery() {
        return this.$oneOfManySubQuery;
    }

    /**
     * qualifySubSelectColumn method.
     * @param {*} $column
     * @returns {any}
     */
    qualifySubSelectColumn($column) {
        return this.getRelationName() + '.' + last($column.split('.'));
    }

    /**
     * qualifyRelatedColumn method.
     * @param {*} $column
     * @returns {any}
     */
    qualifyRelatedColumn($column) {
        return $column.includes('.') ? $column : this.$query.getModel().getTable() + '.' + $column;
    }

    /**
     * isOneOfMany method.
     * @returns {any}
     */
    isOneOfMany() {
        return this.$isOneOfMany === true;
    }

    /**
     * getRelationName method.
     * @returns {any}
     */
    getRelationName() {
        return this.$relationName;
    }
}

module.exports = CanBeOneOfMany