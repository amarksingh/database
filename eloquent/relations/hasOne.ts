const { implement, is_null } = require('@ostro/support/function')
const HasOneOrMany = require('./hasOneOrMany')
const SupportsDefaultModels = require('./concerns/supportsDefaultModels')
const CanBeOneOfMany = require('./concerns/canBeOneOfMany')
/**
 * Class HasOne.
 */
class HasOne extends implement(HasOneOrMany, SupportsDefaultModels, CanBeOneOfMany) {

    /**
     * getResults method.
     * @async
     * @returns {any}
     */
    async getResults() {
        if (is_null(this.getParentKey())) {
            return this.getDefaultFor(this.$parent);
        }

        return (await this.$query.first()) || this.getDefaultFor(this.$parent);
    }

    /**
     * initRelation method.
     * @param {*} $models
     * @param {*} $relation
     * @returns {any}
     */
    initRelation($models: any, $relation: any) {
        for (let $model of $models) {
            $model.setRelation($relation, this.getDefaultFor($model));
        }

        return $models;
    }

    /**
     * match method.
     * @param {*} $models
     * @param {*} $results
     * @param {*} $relation
     * @returns {any}
     */
    match($models: any, $results: any, $relation: any) {
        return this.matchOne($models, $results, $relation);
    }

    /**
     * getRelationExistenceQuery method.
     * @param {*} $query
     * @param {*} $parentQuery
     * @param {*} $columns
     * @returns {any}
     */
    getRelationExistenceQuery($query: any, $parentQuery: any, $columns: any[] = ['*']) {

        return super.getRelationExistenceQuery($query, $parentQuery, $columns);
    }

    /**
     * addOneOfManySubQueryConstraints method.
     * @param {*} $query
     * @param {*} $column
     * @param {*} $aggregate
     * @returns {any}
     */
    addOneOfManySubQueryConstraints($query: any, $column: any = null, $aggregate: any = null) {
        $query.addSelect(this.$foreignKey);
    }

    /**
     * getOneOfManySubQuerySelectColumns method.
     * @returns {any}
     */
    getOneOfManySubQuerySelectColumns() {
        return this.$foreignKey;
    }

    /**
     * addOneOfManyJoinSubQueryConstraints method.
     * @param {*} $join
     * @returns {any}
     */
    addOneOfManyJoinSubQueryConstraints($join: any) {
        $join.on(this.qualifySubSelectColumn(this.$foreignKey), '=', this.qualifyRelatedColumn(this.$foreignKey));
    }

    /**
     * newRelatedInstanceFor method.
     * @param {*} $parent
     * @returns {any}
     */
    newRelatedInstanceFor($parent: any) {
        const instance = this.$related.newInstance();
        instance.setAttribute(this.getForeignKeyName(), $parent[this.$localKey]);
        return instance;
    }

    /**
     * getRelatedKeyFrom method.
     * @param {*} $model
     * @returns {any}
     */
    getRelatedKeyFrom($model: any) {
        return $model.getAttribute(this.getForeignKeyName());
    }
}

module.exports = HasOne