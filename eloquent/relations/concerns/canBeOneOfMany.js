const { last } = require('@ostro/support/function');

class CanBeOneOfMany {

    $isOneOfMany = false;

    getRelationQuery() {
        return this.isOneOfMany() ?
            this.$oneOfManySubQuery :
            this.$query;
    }

    getOneOfManySubQuery() {
        return this.$oneOfManySubQuery;
    }

    qualifySubSelectColumn($column) {
        return this.getRelationName() + '.' + last($column.split('.'));
    }

    qualifyRelatedColumn($column) {
        return $column.includes('.') ? $column : this.$query.getModel().getTable() + '.' + $column;
    }

    isOneOfMany() {
        return this.$isOneOfMany === true;
    }

    getRelationName() {
        return this.$relationName;
    }
}

module.exports = CanBeOneOfMany