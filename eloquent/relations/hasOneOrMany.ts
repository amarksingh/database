const { isset, is_null } = require('@ostro/support/function')
const Relation = require('./relation')
const kForeignKey = Symbol('foreignKey')
const kLocalKey = Symbol('localKey')
/**
 * Class HasOneOrMany.
 */
class HasOneOrMany extends Relation {

    $foreignKey = '';

    $localKey = '';

    /**
     * Create a new instance.
     * @param {*} $query
     * @param {*} $parent
     * @param {*} $foreignKey
     * @param {*} $localKey
     */
    constructor($query, $parent, $foreignKey, $localKey) {
        super($query, $parent);
        this.$localKey = $localKey;
        this.$foreignKey = $foreignKey;
        this.addConstraints();

    }

    /**
     * make method.
     * @param {*} $attributes
     * @returns {any}
     */
    make($attributes = {}) {
        const $instance = this.$related.newInstance();
        $instance.fill($attributes);
        this.setForeignAttributesForCreate($instance);
        return $instance;
    }

    /**
     * makeMany method.
     * @param {*} $records
     * @returns {any}
     */
    makeMany($records) {
        let items = [];

        for (let $record of $records) {
            items.push(this.make($record));
        }

        return this.$related.newCollection(items);
    }

    /**
     * addConstraints method.
     * @returns {any}
     */
    addConstraints() {

        if (this.constructor.$constraints) {
            let $query = this.getRelationQuery();

            $query.where(this.getQualifiedForeignKeyName(), '=', this.getParentKey());

            $query.whereNotNull(this.getQualifiedForeignKeyName());
        }
    }

    /**
     * addEagerConstraints method.
     * @param {*} $models
     * @returns {any}
     */
    addEagerConstraints($models) {
        let $whereIn = this.whereInMethod(this.$parent, this.$localKey);
        return this.getRelationQuery()[$whereIn](
            this.$foreignKey, this.getKeys($models, this.$localKey).filter(res => res)
        );
    }

    /**
     * matchOne method.
     * @param {*} $models
     * @param {*} $results
     * @param {*} $relation
     * @returns {any}
     */
    matchOne($models, $results, $relation) {
        return this.matchOneOrMany($models, $results, $relation, 'one');
    }

    /**
     * matchMany method.
     * @param {*} $models
     * @param {*} $results
     * @param {*} $relation
     * @returns {any}
     */
    matchMany($models, $results, $relation) {
        return this.matchOneOrMany($models, $results, $relation, 'many');
    }

    /**
     * matchOneOrMany method.
     * @param {*} $models
     * @param {*} $results
     * @param {*} $relation
     * @param {*} $type
     * @returns {any}
     */
    matchOneOrMany($models, $results, $relation, $type) {
        let $dictionary = this.buildDictionary($results);

        for (let $model of $models) {
            let $key = this.getDictionaryKey($model.getAttribute(this.$localKey))
            if (isset($dictionary[$key])) {
                $model.setRelation(
                    $relation, this.getRelationValue($dictionary, $key, $type)
                );
            }

        }

        return $models;
    }

    /**
     * getRelationValue method.
     * @param {*} $dictionary
     * @param {*} $key
     * @param {*} $type
     * @returns {any}
     */
    getRelationValue($dictionary, $key, $type) {
        let $value = $dictionary[$key]
        return $type === 'one' ? ($value[0] || null) : this.$related.newCollection($value);
    }

    /**
     * buildDictionary method.
     * @param {*} $results
     * @returns {any}
     */
    buildDictionary($results) {
        let $foreign = this.getForeignKeyName();
        let $res = {}
        $results.forEach(($result) => {
            let $key = this.getDictionaryKey($result[$foreign])
            if (!Array.isArray($res[$key])) {
                $res[$key] = []
            }
            $res[$key].push($result)
        });

        return $res
    }

    /**
     * findOrNew method.
     * @async
     * @param {*} $id
     * @param {*} $columns
     * @returns {any}
     */
    async findOrNew($id, $columns = ['*']) {
        let $instance = await this.find($id, $columns);
        if (is_null($instance)) {
            $instance = this.$related.newInstance();

            this.setForeignAttributesForCreate($instance);
        }

        return $instance;
    }

    /**
     * firstOrNew method.
     * @async
     * @param {*} $attributes
     * @param {*} $values
     * @returns {any}
     */
    async firstOrNew($attributes = {}, $values = {}) {
        let $instance = await this.where($attributes).first();
        if (is_null($instance)) {
            $instance = this.$related.newInstance();
            $instance.fill({ ...$attributes, ...$values });

            this.setForeignAttributesForCreate($instance);
        }

        return $instance;
    }

    /**
     * firstOrCreate method.
     * @async
     * @param {*} $attributes
     * @param {*} $values
     * @returns {any}
     */
    async firstOrCreate($attributes = {}, $values = {}) {
        let $instance = await this.where($attributes).first();
        if (is_null($instance)) {
            $instance = await this.create({ ...$attributes, ...$values });
        }

        return $instance;
    }

    /**
     * updateOrCreate method.
     * @async
     * @param {*} $attributes
     * @param {*} $values
     * @returns {any}
     */
    async updateOrCreate($attributes, $values = {}) {
        const $instance = await this.firstOrNew($attributes)

        $instance.fill($values);

        await $instance.save();
    }

    /**
     * save method.
     * @async
     * @param {*} $model
     * @returns {any}
     */
    async save($model) {
        this.setForeignAttributesForCreate($model);

        return await $model.save() ? $model : false;
    }

    /**
     * saveMany method.
     * @async
     * @param {*} $models
     * @returns {any}
     */
    async saveMany($models) {
        for (let $model of $models) {
            await this.save($model);
        }

        return $models;
    }

    /**
     * create method.
     * @async
     * @param {*} $attributes
     * @returns {any}
     */
    async create($attributes = {}) {
        const $instance = this.$related.newInstance();
        $instance.fill($attributes);
        this.setForeignAttributesForCreate($instance);
        await $instance.save();
        return $instance;
    }

    /**
     * createMany method.
     * @async
     * @param {*} $records
     * @returns {any}
     */
    async createMany($records) {
        let items = [];

        for (let $record of $records) {
            items.push(await this.create($record));
        }
        return this.$related.newCollection(items);
    }

    /**
     * setForeignAttributesForCreate method.
     * @param {*} $model
     * @returns {any}
     */
    setForeignAttributesForCreate($model) {
        $model.setAttribute(this.getForeignKeyName(), this.getParentKey());
    }

    /**
     * getRelationExistenceQuery method.
     * @param {*} $query
     * @param {*} $parentQuery
     * @param {*} $columns
     * @returns {any}
     */
    getRelationExistenceQuery($query, $parentQuery, $columns = ['*']) {
        if ($query.getTable() == $parentQuery.getTable()) {
            return this.getRelationExistenceQueryForSelfRelation($query, $parentQuery, $columns);
        }

        return super.getRelationExistenceQuery($query, $parentQuery, $columns);
    }

    /**
     * getRelationExistenceQueryForSelfRelation method.
     * @param {*} $query
     * @param {*} $parentQuery
     * @param {*} $columns
     * @returns {any}
     */
    getRelationExistenceQueryForSelfRelation($query, $parentQuery, $columns = ['*']) {
        let $hash = this.getRelationCountHash()
        $query.from($query.getModel().getTable() + ' as ' + $hash);

        $query.getModel().setTable($hash);

        return $query.select($columns).whereRaw(
            this.getQualifiedParentKeyName() + '=' + $hash + '.' + this.getForeignKeyName()
        );
    }

    /**
     * getExistenceCompareKey method.
     * @returns {any}
     */
    getExistenceCompareKey() {
        return this.getQualifiedForeignKeyName();
    }

    /**
     * getParentKey method.
     * @returns {any}
     */
    getParentKey() {
        return this.$parent.getAttribute(this.$localKey);
    }

    /**
     * getQualifiedParentKeyName method.
     * @returns {any}
     */
    getQualifiedParentKeyName() {
        return this.$parent.qualifyColumn(this.$localKey);
    }

    /**
     * getForeignKeyName method.
     * @returns {any}
     */
    getForeignKeyName() {
        let $segments = this.getQualifiedForeignKeyName().split('.');

        return $segments[$segments.length - 1];
    }

    /**
     * getQualifiedForeignKeyName method.
     * @returns {any}
     */
    getQualifiedForeignKeyName() {
        return this.$foreignKey;
    }

    /**
     * getLocalKeyName method.
     * @returns {any}
     */
    getLocalKeyName() {
        return this.$localKey;
    }
}

module.exports = HasOneOrMany
