const { isset, is_null } = require('@ostro/support/function')
const Relation = require('./relation')
const kForeignKey = Symbol('foreignKey')
const kLocalKey = Symbol('localKey')
class HasOneOrMany extends Relation {

    $foreignKey = '';

    $localKey = '';

    constructor($query, $parent, $foreignKey, $localKey) {
        super($query, $parent);
        this.$localKey = $localKey;
        this.$foreignKey = $foreignKey;
        this.addConstraints();

    }

    make($attributes = {}) {
        const $instance = this.$related.newInstance();
        $instance.fill($attributes);
        this.setForeignAttributesForCreate($instance);
        return $instance;
    }

    makeMany($records) {
        let items = [];

        for (let $record of $records) {
            items.push(this.make($record));
        }

        return this.$related.newCollection(items);
    }

    addConstraints() {

        if (this.constructor.$constraints) {
            let $query = this.getRelationQuery();

            $query.where(this.getQualifiedForeignKeyName(), '=', this.getParentKey());

            $query.whereNotNull(this.getQualifiedForeignKeyName());
        }
    }

    addEagerConstraints($models) {
        let $whereIn = this.whereInMethod(this.$parent, this.$localKey);
        return this.getRelationQuery()[$whereIn](
            this.$foreignKey, this.getKeys($models, this.$localKey).filter(res => res)
        );
    }

    matchOne($models, $results, $relation) {
        return this.matchOneOrMany($models, $results, $relation, 'one');
    }

    matchMany($models, $results, $relation) {
        return this.matchOneOrMany($models, $results, $relation, 'many');
    }

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

    getRelationValue($dictionary, $key, $type) {
        let $value = $dictionary[$key]
        return $type === 'one' ? ($value[0] || null) : this.$related.newCollection($value);
    }

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

    async findOrNew($id, $columns = ['*']) {
        let $instance = await this.find($id, $columns);
        if (is_null($instance)) {
            $instance = this.$related.newInstance();

            this.setForeignAttributesForCreate($instance);
        }

        return $instance;
    }

    async firstOrNew($attributes = {}, $values = {}) {
        let $instance = await this.where($attributes).first();
        if (is_null($instance)) {
            $instance = this.$related.newInstance();
            $instance.fill({ ...$attributes, ...$values });

            this.setForeignAttributesForCreate($instance);
        }

        return $instance;
    }

    async firstOrCreate($attributes = {}, $values = {}) {
        let $instance = await this.where($attributes).first();
        if (is_null($instance)) {
            $instance = await this.create({ ...$attributes, ...$values });
        }

        return $instance;
    }

    async updateOrCreate($attributes, $values = {}) {
        const $instance = await this.firstOrNew($attributes)

        $instance.fill($values);

        await $instance.save();
    }

    async save($model) {
        this.setForeignAttributesForCreate($model);

        return await $model.save() ? $model : false;
    }

    async saveMany($models) {
        for (let $model of $models) {
            await this.save($model);
        }

        return $models;
    }

    async create($attributes = {}) {
        const $instance = this.$related.newInstance();
        $instance.fill($attributes);
        this.setForeignAttributesForCreate($instance);
        await $instance.save();
        return $instance;
    }

    async createMany($records) {
        let items = [];

        for (let $record of $records) {
            items.push(await this.create($record));
        }
        return this.$related.newCollection(items);
    }

    setForeignAttributesForCreate($model) {
        $model.setAttribute(this.getForeignKeyName(), this.getParentKey());
    }

    getRelationExistenceQuery($query, $parentQuery, $columns = ['*']) {
        if ($query.getTable() == $parentQuery.getTable()) {
            return this.getRelationExistenceQueryForSelfRelation($query, $parentQuery, $columns);
        }

        return super.getRelationExistenceQuery($query, $parentQuery, $columns);
    }

    getRelationExistenceQueryForSelfRelation($query, $parentQuery, $columns = ['*']) {
        let $hash = this.getRelationCountHash()
        $query.from($query.getModel().getTable() + ' as ' + $hash);

        $query.getModel().setTable($hash);

        return $query.select($columns).whereRaw(
            this.getQualifiedParentKeyName() + '=' + $hash + '.' + this.getForeignKeyName()
        );
    }

    getExistenceCompareKey() {
        return this.getQualifiedForeignKeyName();
    }

    getParentKey() {
        return this.$parent.getAttribute(this.$localKey);
    }

    getQualifiedParentKeyName() {
        return this.$parent.qualifyColumn(this.$localKey);
    }

    getForeignKeyName() {
        let $segments = this.getQualifiedForeignKeyName().split('.');

        return $segments[$segments.length - 1];
    }

    getQualifiedForeignKeyName() {
        return this.$foreignKey;
    }

    getLocalKeyName() {
        return this.$localKey;
    }
}

module.exports = HasOneOrMany
