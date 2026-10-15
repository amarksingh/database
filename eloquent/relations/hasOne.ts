const { implement, is_null } = require('@ostro/support/function')
const HasOneOrMany = require('./hasOneOrMany')
const SupportsDefaultModels = require('./concerns/supportsDefaultModels')
const CanBeOneOfMany = require('./concerns/canBeOneOfMany')
class HasOne extends implement(HasOneOrMany, SupportsDefaultModels, CanBeOneOfMany) {

    async getResults() {
        if (is_null(this.getParentKey())) {
            return this.getDefaultFor(this.$parent);
        }

        return (await this.$query.first()) || this.getDefaultFor(this.$parent);
    }

    initRelation($models, $relation) {
        for (let $model of $models) {
            $model.setRelation($relation, this.getDefaultFor($model));
        }

        return $models;
    }

    match($models, $results, $relation) {
        return this.matchOne($models, $results, $relation);
    }

    getRelationExistenceQuery($query, $parentQuery, $columns = ['*']) {

        return super.getRelationExistenceQuery($query, $parentQuery, $columns);
    }

    addOneOfManySubQueryConstraints($query, $column = null, $aggregate = null) {
        $query.addSelect(this.$foreignKey);
    }

    getOneOfManySubQuerySelectColumns() {
        return this.$foreignKey;
    }

    addOneOfManyJoinSubQueryConstraints($join) {
        $join.on(this.qualifySubSelectColumn(this.$foreignKey), '=', this.qualifyRelatedColumn(this.$foreignKey));
    }

    newRelatedInstanceFor($parent) {
        const instance = this.$related.newInstance();
        instance.setAttribute(this.getForeignKeyName(), $parent[this.$localKey]);
        return instance;
    }

    getRelatedKeyFrom($model) {
        return $model.getAttribute(this.getForeignKeyName());
    }
}

module.exports = HasOne