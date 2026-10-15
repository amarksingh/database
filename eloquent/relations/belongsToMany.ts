const { implement, isset, is_array, is_null, collect, count, empty, get_class, tap } = require('@ostro/support/function');
const { contains } = require('@ostro/support/string');
const Relation = require('./relation')
const CollectionInterface = require('@ostro/contracts/collection/collect')
const InteractsWithPivotTable = require('./concerns/interactsWithPivotTable')
const Pivot = require('./pivot');
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException');
const ModelNotFoundException = require('../modelNotFoundException');
const Model = require('@ostro/contracts/database/eloquent/model');
/**
 * Class BelongsToMany.
 */
class BelongsToMany extends implement(Relation, InteractsWithPivotTable) {

    $table;

    $foreignPivotKey;

    $relatedPivotKey;

    $parentKey;

    $relatedKey;

    $relationName;

    $pivotColumns = [];

    $pivotWheres = [];

    $pivotWhereIns = [];

    $pivotWhereNulls = [];

    $pivotValues = [];

    $withTimestamps = false;

    $pivotCreatedAt;

    $pivotUpdatedAt;

    $using;

    $accessor = 'pivot';

    /**
     * Create a new instance.
     * @param {*} $query
     * @param {*} $parent
     * @param {*} $table
     * @param {*} $foreignPivotKey
     * @param {*} $relatedPivotKey
     * @param {*} $parentKey
     * @param {*} $relatedKey
     * @param {*} $relationName
     */
    constructor($query, $parent, $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relationName = null) {
        super($query, $parent);

        this.$parentKey = $parentKey;
        this.$relatedKey = $relatedKey;
        this.$relationName = $relationName;
        this.$relatedPivotKey = $relatedPivotKey;
        this.$foreignPivotKey = $foreignPivotKey;
        this.$table = this.resolveTableName($table);
        this.addConstraints()

    }

    /**
     * resolveTableName method.
     * @param {*} $table
     * @returns {any}
     */
    resolveTableName($table) {
        if (typeof $table === 'function') {
            const $model = new $table;
            if ($model instanceof Model || (typeof $model.getTable === 'function')) {
                return $model.getTable();
            }
        }

        if (typeof $table === 'string' && !contains($table, '\\') && !contains($table, '/')) {
            return $table;
        }

        return $table;
    }

    /**
     * addConstraints method.
     * @returns {any}
     */
    addConstraints() {

        this.performJoin();
        if (this.constructor.$constraints) {
            this.addWhereConstraints();
        }
    }

    /**
     * performJoin method.
     * @param {*} $query
     * @returns {any}
     */
    performJoin($query = null) {
        $query = $query || this.$query;

        $query.join(
            this.$table,
            this.getQualifiedRelatedKeyName(),
            '=',
            this.getQualifiedRelatedPivotKeyName()
        );

        return this;
    }

    /**
     * addWhereConstraints method.
     * @returns {any}
     */
    addWhereConstraints() {
        this.$query.where(
            this.getQualifiedForeignPivotKeyName(), '=', this.$parent[this.$parentKey]
        );

        return this;
    }

    /**
     * addEagerConstraints method.
     * @param {*} $models
     * @returns {any}
     */
    addEagerConstraints($models) {
        let $whereIn = this.whereInMethod(this.$parent, this.$parentKey);
        this.$query[$whereIn](
            this.getQualifiedForeignPivotKeyName(),
            this.getKeys($models, this.$parentKey)
        );

    }

    /**
     * initRelation method.
     * @param {*} $models
     * @param {*} $relation
     * @returns {any}
     */
    initRelation($models, $relation) {
        for (let $model of $models) {

            $model.setRelation($relation, this.$related.newCollection());
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
    match($models, $results, $relation) {
        let $dictionary = this.buildDictionary($results);

        for (let $model of $models) {
            let $key = this.getDictionaryKey($model[this.$parentKey]);

            if (isset($dictionary[$key])) {
                $model.setRelation(
                    $relation, this.$related.newCollection($dictionary[$key])
                );
            }
        }
        return $models;
    }

    /**
     * buildDictionary method.
     * @param {*} $results
     * @returns {any}
     */
    buildDictionary($results) {

        let $dictionary = {};
        for (let $result of $results) {
            let $value = this.getDictionaryKey($result[this.$accessor][this.$foreignPivotKey]);

            if (!Array.isArray($dictionary[$value])) {
                $dictionary[$value] = []
            }

            $dictionary[$value].push($result);
        }

        return $dictionary;
    }

    /**
     * getPivotClass method.
     * @returns {any}
     */
    getPivotClass() {
        return this.$using || Pivot;
    }

    /**
     * using method.
     * @param {*} $class
     * @returns {any}
     */
    using($class) {
        this.$using = $class;

        return this;
    }

    /**
     * as method.
     * @param {*} $accessor
     * @returns {any}
     */
    as($accessor) {
        this.$accessor = $accessor;

        return this;
    }

    /**
     * wherePivot method.
     * @param {*} $column
     * @param {*} $operator
     * @param {*} $value
     * @param {*} $boolean
     * @returns {any}
     */
    wherePivot($column, $operator = null, $value = null, $boolean = 'and') {
        this.$pivotWheres.push(arguments);

        return this.where(this.qualifyPivotColumn($column), $operator, $value, $boolean);
    }

    /**
     * wherePivotBetween method.
     * @param {*} $column
     * @param {*} $values
     * @param {*} $boolean
     * @param {*} $not
     * @returns {any}
     */
    wherePivotBetween($column, $values, $boolean = 'and', $not = false) {
        return this.whereBetween(this.qualifyPivotColumn($column), $values, $boolean, $not);
    }

    /**
     * orWherePivotBetween method.
     * @param {*} $column
     * @param {*} $values
     * @returns {any}
     */
    orWherePivotBetween($column, $values) {
        return this.wherePivotBetween($column, $values, 'or');
    }

    /**
     * wherePivotNotBetween method.
     * @param {*} $column
     * @param {*} $values
     * @param {*} $boolean
     * @returns {any}
     */
    wherePivotNotBetween($column, $values, $boolean = 'and') {
        return this.wherePivotBetween($column, $values, $boolean, true);
    }

    /**
     * orWherePivotNotBetween method.
     * @param {*} $column
     * @param {*} $values
     * @returns {any}
     */
    orWherePivotNotBetween($column, $values) {
        return this.wherePivotBetween($column, $values, 'or', true);
    }

    /**
     * wherePivotIn method.
     * @param {*} $column
     * @param {*} $values
     * @param {*} $boolean
     * @param {*} $not
     * @returns {any}
     */
    wherePivotIn($column, $values, $boolean = 'and', $not = false) {
        this.$pivotWhereIns.push(arguments);

        if ($not) {
            return this.whereNotIn(this.qualifyPivotColumn($column), $values);
        }
        return this.whereIn(this.qualifyPivotColumn($column), $values);
    }

    /**
     * orWherePivot method.
     * @param {*} $column
     * @param {*} $operator
     * @param {*} $value
     * @returns {any}
     */
    orWherePivot($column, $operator = null, $value = null) {
        return this.wherePivot($column, $operator, $value, 'or');
    }

    /**
     * withPivotValue method.
     * @param {*} $column
     * @param {*} $value
     * @returns {any}
     */
    withPivotValue($column, $value = null) {
        if (is_array($column) || (typeof $column === 'object' && $column !== null)) {
            for (let $name in $column) {
                let $value = $column[$name]
                this.withPivotValue($name, $value);
            }

            return this;
        }

        if (is_null($value)) {
            throw new InvalidArgumentException('The provided value may not be null.');
        }

        this.$pivotValues.push({ column: $column, value: $value });

        return this.wherePivot($column, '=', $value);
    }

    /**
     * orWherePivotIn method.
     * @param {*} $column
     * @param {*} $values
     * @returns {any}
     */
    orWherePivotIn($column, $values) {
        return this.wherePivotIn($column, $values, 'or');
    }

    /**
     * wherePivotNotIn method.
     * @param {*} $column
     * @param {*} $values
     * @param {*} $boolean
     * @returns {any}
     */
    wherePivotNotIn($column, $values, $boolean = 'and') {
        return this.wherePivotIn($column, $values, $boolean, true);
    }

    /**
     * orWherePivotNotIn method.
     * @param {*} $column
     * @param {*} $values
     * @returns {any}
     */
    orWherePivotNotIn($column, $values) {
        return this.wherePivotNotIn($column, $values, 'or');
    }

    /**
     * wherePivotNull method.
     * @param {*} $column
     * @param {*} $boolean
     * @param {*} $not
     * @returns {any}
     */
    wherePivotNull($column, $boolean = 'and', $not = false) {
        this.$pivotWhereNulls.push(arguments);

        return this.whereNull(this.qualifyPivotColumn($column), $boolean, $not);
    }

    /**
     * wherePivotNotNull method.
     * @param {*} $column
     * @param {*} $boolean
     * @returns {any}
     */
    wherePivotNotNull($column, $boolean = 'and') {
        return this.wherePivotNull($column, $boolean, true);
    }

    /**
     * orWherePivotNull method.
     * @param {*} $column
     * @param {*} $not
     * @returns {any}
     */
    orWherePivotNull($column, $not = false) {
        return this.wherePivotNull($column, 'or', $not);
    }

    /**
     * orWherePivotNotNull method.
     * @param {*} $column
     * @returns {any}
     */
    orWherePivotNotNull($column) {
        return this.orWherePivotNull($column, true);
    }

    /**
     * orderByPivot method.
     * @param {*} $column
     * @param {*} $direction
     * @returns {any}
     */
    orderByPivot($column, $direction = 'asc') {
        return this.orderBy(this.qualifyPivotColumn($column), $direction);
    }

    /**
     * findOrNew method.
     * @async
     * @param {*} $id
     * @param {*} $columns
     * @returns {any}
     */
    async findOrNew($id, $columns = ['*']) {
        let $instance = await this.find($id, $columns)
        if (is_null($instance)) {
            $instance = this.$related.newInstance();
        }

        return $instance;
    }

    /**
     * firstOrNew method.
     * @async
     * @param {*} $attributes
     * @returns {any}
     */
    async firstOrNew($attributes = {}) {
        let $instance = await this.where($attributes).first();
        if (is_null($instance)) {
            $instance = this.$related.newInstance($attributes);
            $instance.fill($attributes);
        }

        return $instance;
    }

    /**
     * firstOrCreate method.
     * @async
     * @param {*} $attributes
     * @param {*} $joining
     * @param {*} $touch
     * @returns {any}
     */
    async firstOrCreate($attributes, $joining = [], $touch = true) {
        let $instance = await this.where($attributes).first()
        if (is_null($instance)) {
            $instance = await this.create($attributes, $joining, $touch);
        }

        return $instance;
    }

    /**
     * updateOrCreate method.
     * @async
     * @param {*} $attributes
     * @param {*} $values
     * @param {*} $joining
     * @param {*} $touch
     * @returns {any}
     */
    async updateOrCreate($attributes, $values = [], $joining = [], $touch = true) {
        let $instance = await this.where($attributes).first()
        if (is_null($instance)) {
            return this.create($values, $joining, $touch);
        }

        $instance.fill($values);

        await $instance.save({ 'touch': false });

        return $instance;
    }

    /**
     * find method.
     * @param {*} $id
     * @param {*} $columns
     * @returns {any}
     */
    find($id, $columns = ['*']) {
        if (!($id instanceof Model) && (is_array($id) || $id instanceof Array)) {
            return this.findMany($id, $columns);
        }

        return this.where(
            this.getRelated().getQualifiedKeyName(), '=', this.parseId($id)
        ).first($columns);
    }

    /**
     * findMany method.
     * @param {*} $ids
     * @param {*} $columns
     * @returns {any}
     */
    findMany($ids, $columns = ['*']) {
        $ids = $ids instanceof CollectionInterface ? $ids.toArray() : $ids;

        if (empty($ids)) {
            return this.getRelated().newCollection();
        }

        return this.whereIn(
            this.getRelated().getQualifiedKeyName(), this.parseIds($ids)
        ).get($columns);
    }

    /**
     * findOrFail method.
     * @async
     * @param {*} $id
     * @param {*} $columns
     * @returns {any}
     */
    async findOrFail($id, $columns = ['*']) {
        let $result = await this.find($id, $columns);

        $id = $id instanceof CollectionInterface ? $id.toArray() : $id;

        if (is_array($id)) {
            let resultCount = $result && typeof $result.count === 'function' ? $result.count() : ($result ? $result.length : 0);
            if (resultCount === count([...new Set($id)])) {
                return $result;
            }
        } else if (!is_null($result)) {
            return $result;
        }

        throw (new ModelNotFoundException).setModel(get_class(this.$related), $id);
    }

    /**
     * findOr method.
     * @async
     * @param {*} $id
     * @param {*} $columns
     * @param {*} $callback
     * @returns {any}
     */
    async findOr($id, $columns = ['*'], $callback = null) {
        if (typeof $columns === 'function') {
            $callback = $columns;
            $columns = ['*'];
        }

        let $result = await this.find($id, $columns);

        $id = $id instanceof CollectionInterface ? $id.toArray() : $id;

        if (is_array($id)) {
            let resultCount = $result && typeof $result.count === 'function' ? $result.count() : ($result ? $result.length : 0);
            if (resultCount === count([...new Set($id)])) {
                return $result;
            }
        } else if (!is_null($result)) {
            return $result;
        }

        return $callback();
    }

    /**
     * firstWhere method.
     * @param {*} $column
     * @param {*} $operator
     * @param {*} $value
     * @param {*} $boolean
     * @returns {any}
     */
    firstWhere($column, $operator = null, $value = null, $boolean = 'and') {
        if (arguments.length === 2) {
            return this.where($column, '=', $operator).first();
        }
        return this.where($column, $operator, $value, $boolean).first();
    }

    /**
     * first method.
     * @async
     * @param {*} $columns
     * @returns {any}
     */
    async first($columns = ['*']) {
        let $results = await this.take(1).get($columns);

        return count($results) > 0 ? $results.first() : null;
    }

    /**
     * firstOrFail method.
     * @async
     * @param {*} $columns
     * @returns {any}
     */
    async firstOrFail($columns = ['*']) {
        let $model = await this.first($columns)
        if (!is_null($model)) {
            return $model;
        }

        throw (new ModelNotFoundException).setModel(get_class(this.$related));
    }

    /**
     * getResults method.
     * @async
     * @returns {any}
     */
    async getResults() {
        return !is_null(this.$parent[this.$parentKey]) ?
            await this.get() :
            this.$related.newCollection();
    }

    /**
     * get method.
     * @async
     * @param {*} $columns
     * @returns {any}
     */
    async get($columns = ['*']) {

        let $builder = this.$query;

        const statements = $builder.getQueryBuilder ? $builder.getQueryBuilder()._statements : ($builder.$query?._statements || $builder.getQuery()?._statements);
        const hasColumns = Array.isArray(statements) && statements.find(res => res.grouping == 'columns');
        $columns = hasColumns ? [] : $columns;
        let $models = $builder.select(
            this.shouldSelect($columns)
        )

        $models = await $models.getModels();

        this.hydratePivotRelation($models);

        if (count($models) > 0) {
            $models = await $builder.eagerLoadRelations($models);

        }

        return $models;
    }

    /**
     * shouldSelect method.
     * @param {*} $columns
     * @returns {any}
     */
    shouldSelect($columns = ['*']) {
        if ($columns.includes('*')) {
            $columns = [this.$related.getTable() + '.*'];
        }

        return $columns.concat(this.aliasedPivotColumns());
    }

    /**
     * aliasedPivotColumns method.
     * @returns {any}
     */
    aliasedPivotColumns() {
        let $defaults = [this.$foreignPivotKey, this.$relatedPivotKey];

        return collect($defaults.concat(this.$pivotColumns)).map(($column) => {
            return this.qualifyPivotColumn($column) + ' as pivot_' + $column;
        }).unique().all();
    }

    /**
     * paginate method.
     * @param {*} $perPage
     * @param {*} $columns
     * @param {*} $pageName
     * @param {*} $page
     * @returns {any}
     */
    paginate($perPage = null, $columns = ['*'], $pageName = 'page', $page = null) {

        this.$query.addSelect(this.shouldSelect($columns));

        return tap(this.$query.paginate($perPage, $columns, $pageName, $page), ($paginator) => {
            this.hydratePivotRelation($paginator.items());
        });
    }

    /**
     * simplePaginate method.
     * @param {*} $perPage
     * @param {*} $columns
     * @param {*} $pageName
     * @param {*} $page
     * @returns {any}
     */
    simplePaginate($perPage = null, $columns = ['*'], $pageName = 'page', $page = null) {
        this.$query.addSelect(this.shouldSelect($columns));

        return tap(this.$query.simplePaginate($perPage, $columns, $pageName, $page), ($paginator) => {
            this.hydratePivotRelation($paginator.items());
        });
    }

    /**
     * cursorPaginate method.
     * @param {*} $perPage
     * @param {*} $columns
     * @param {*} $cursorName
     * @param {*} $cursor
     * @returns {any}
     */
    cursorPaginate($perPage = null, $columns = ['*'], $cursorName = 'cursor', $cursor = null) {
        this.$query.addSelect(this.shouldSelect($columns));

        return tap(this.$query.cursorPaginate($perPage, $columns, $cursorName, $cursor), ($paginator) => {
            this.hydratePivotRelation($paginator.items());
        });
    }

    /**
     * chunk method.
     * @param {*} $count
     * @param {*} $callback
     * @returns {any}
     */
    chunk($count, $callback) {
        return this.prepareQueryBuilder().chunk($count, ($results, $page) => {
            this.hydratePivotRelation($results.all());

            return $callback($results, $page);
        });
    }

    /**
     * chunkById method.
     * @param {*} $count
     * @param {*} $callback
     * @param {*} $column
     * @param {*} $alias
     * @returns {any}
     */
    chunkById($count, $callback, $column = null, $alias = null) {
        this.prepareQueryBuilder();

        $column = $column || this.getRelated().qualifyColumn(
            this.getRelatedKeyName()
        );

        $alias = $alias || this.getRelatedKeyName();

        return this.$query.chunkById($count, ($results) => {
            this.hydratePivotRelation($results.all());

            return $callback($results);
        }, $column, $alias);
    }

    /**
     * each method.
     * @param {*} $callback
     * @param {*} $count
     * @returns {any}
     */
    each($callback, $count = 1000) {
        return this.chunk($count, ($results) => {
            for (let $key in $results) {
                let $value = $results[$key]
                if ($callback($value, $key) === false) {
                    return false;
                }
            }
        });
    }

    /**
     * lazy method.
     * @param {*} $chunkSize
     * @returns {any}
     */
    lazy($chunkSize = 1000) {
        return this.prepareQueryBuilder().lazy($chunkSize).map(($model) => {
            this.hydratePivotRelation([$model]);

            return $model;
        });
    }

    /**
     * lazyById method.
     * @param {*} $chunkSize
     * @param {*} $column
     * @param {*} $alias
     * @returns {any}
     */
    lazyById($chunkSize = 1000, $column = null, $alias = null) {
        $column = $column || this.getRelated().qualifyColumn(
            this.getRelatedKeyName()
        );

        $alias = $alias || this.getRelatedKeyName();

        return this.prepareQueryBuilder().lazyById($chunkSize, $column, $alias).map(($model) => {
            this.hydratePivotRelation([$model]);

            return $model;
        });
    }

    /**
     * cursor method.
     * @returns {any}
     */
    cursor() {
        return this.prepareQueryBuilder().cursor().map(($model) => {
            this.hydratePivotRelation([$model]);

            return $model;
        });
    }

    /**
     * prepareQueryBuilder method.
     * @returns {any}
     */
    prepareQueryBuilder() {
        return this.$query.select(this.shouldSelect());
    }

    /**
     * hydratePivotRelation method.
     * @param {*} $models
     * @returns {any}
     */
    hydratePivotRelation($models) {

        for (let $model of $models) {
            $model.setRelation(this.$accessor, this.migratePivotAttributes($model));

        }

    }

    /**
     * migratePivotAttributes method.
     * @param {*} $model
     * @returns {any}
     */
    migratePivotAttributes($model) {
        let $values = {};
        let attributes = $model.getAttributes()
        for (let $key in attributes) {
            let $value = attributes[$key]

            if ($key.startsWith('pivot_')) {
                $values[$key.substr(6)] = $value;

                delete attributes[$key];
            }

        }

        return $values;
    }

    /**
     * touchIfTouching method.
     * @async
     * @returns {any}
     */
    async touchIfTouching() {
        if (this.touchingParent()) {
            await this.getParent().touch();
        }

        if (this.getParent().touches(this.$relationName)) {
            await this.touch();
        }
    }

    /**
     * touchingParent method.
     * @returns {any}
     */
    touchingParent() {
        return this.getRelated().touches(this.guessInverseRelation());
    }

    /**
     * guessInverseRelation method.
     * @returns {any}
     */
    guessInverseRelation() {
        return this.getParent().getTable();
        // return String.camel(String.pluralStudly(class_basename(this.getParent())));
    }

    /**
     * touch method.
     * @async
     * @returns {any}
     */
    async touch() {
        let $key = this.getRelated().getKeyName();

        let $columns = {
            [this.$related.getUpdatedAtColumn()]: this.$related.freshTimestampString(),
        };
        let $ids = await this.allRelatedIds();
        let rawIds = Array.isArray($ids) ? $ids : ($ids && typeof $ids.all === 'function' ? $ids.all() : []);
        if (rawIds.length > 0) {
            await this.getRelated().newQueryWithoutRelationships().whereIn($key, rawIds).update($columns);
        }
    }

    /**
     * allRelatedIds method.
     * @returns {any}
     */
    allRelatedIds() {
        return this.newPivotQuery().pluck(this.$relatedPivotKey);
    }

    /**
     * save method.
     * @async
     * @param {*} $model
     * @param {*} $pivotAttributes
     * @param {*} $touch
     * @returns {any}
     */
    async save($model, $pivotAttributes = [], $touch = true) {
        await $model.save({ 'touch': false });

        await this.attach($model, $pivotAttributes, $touch);

        return $model;
    }

    /**
     * saveMany method.
     * @async
     * @param {*} $models
     * @param {*} $pivotAttributes
     * @returns {any}
     */
    async saveMany($models, $pivotAttributes = []) {
        for (let $key in $models) {
            let $model = $models[$key]
            await this.save($model, ($pivotAttributes[$key] || []), false);
        }

        await this.touchIfTouching();

        return $models;
    }

    /**
     * create method.
     * @async
     * @param {*} $attributes
     * @param {*} $joining
     * @param {*} $touch
     * @returns {any}
     */
    async create($attributes = [], $joining = [], $touch = true) {
        const $instance = this.$related.newInstance($attributes);
        $instance.fill($attributes);

        await $instance.save({ 'touch': false });

        await this.attach($instance, $joining, $touch);

        return $instance;
    }

    /**
     * createMany method.
     * @async
     * @param {*} $records
     * @param {*} $joinings
     * @returns {any}
     */
    async createMany($records, $joinings = []) {
        const createPromises = Object.keys($records).map($key => {
            let $record = $records[$key];
            return this.create($record, ($joinings[$key] || []), false);
        });
        const $instances = await Promise.all(createPromises);

        await this.touchIfTouching();

        return $instances;
    }

    /**
     * getRelationExistenceQuery method.
     * @param {*} $query
     * @param {*} $parentQuery
     * @param {*} $columns
     * @returns {any}
     */
    getRelationExistenceQuery($query, $parentQuery, $columns = ['*']) {
        if ($parentQuery.getTable() == $query.getTable()) {
            return this.getRelationExistenceQueryForSelfJoin($query, $parentQuery, $columns);
        }

        this.performJoin($query);

        return super.getRelationExistenceQuery($query, $parentQuery, $columns);
    }

    /**
     * getRelationExistenceQueryForSelfJoin method.
     * @param {*} $query
     * @param {*} $parentQuery
     * @param {*} $columns
     * @returns {any}
     */
    getRelationExistenceQueryForSelfJoin($query, $parentQuery, $columns = ['*']) {

        $query.select($columns);
        let $hash = this.getRelationCountHash();
        let originalTable = this.$related.getTable();
        $query.from(originalTable + ' as ' + $hash);

        this.$related.setTable($hash);
        this.performJoin($query);

        let result = super.getRelationExistenceQuery($query, $parentQuery, $columns);
        this.$related.setTable(originalTable);
        return result;
    }

    /**
     * getExistenceCompareKey method.
     * @returns {any}
     */
    getExistenceCompareKey() {
        return this.getQualifiedForeignPivotKeyName();
    }

    /**
     * withTimestamps method.
     * @param {*} $createdAt
     * @param {*} $updatedAt
     * @returns {any}
     */
    withTimestamps($createdAt = null, $updatedAt = null) {
        this.$withTimestamps = true;

        this.$pivotCreatedAt = $createdAt;
        this.$pivotUpdatedAt = $updatedAt;

        return this.withPivot(this.createdAt(), this.updatedAt());
    }

    /**
     * createdAt method.
     * @returns {any}
     */
    createdAt() {
        return this.$pivotCreatedAt || this.$parent.getCreatedAtColumn();
    }

    /**
     * updatedAt method.
     * @returns {any}
     */
    updatedAt() {
        return this.$pivotUpdatedAt || this.$parent.getUpdatedAtColumn();
    }

    /**
     * getForeignPivotKeyName method.
     * @returns {any}
     */
    getForeignPivotKeyName() {
        return this.$foreignPivotKey;
    }

    /**
     * getQualifiedForeignPivotKeyName method.
     * @returns {any}
     */
    getQualifiedForeignPivotKeyName() {
        return this.qualifyPivotColumn(this.$foreignPivotKey);
    }

    /**
     * getRelatedPivotKeyName method.
     * @returns {any}
     */
    getRelatedPivotKeyName() {
        return this.$relatedPivotKey;
    }

    /**
     * getQualifiedRelatedPivotKeyName method.
     * @returns {any}
     */
    getQualifiedRelatedPivotKeyName() {
        return this.qualifyPivotColumn(this.$relatedPivotKey);
    }

    /**
     * getParentKeyName method.
     * @returns {any}
     */
    getParentKeyName() {
        return this.$parentKey;
    }

    /**
     * getQualifiedParentKeyName method.
     * @returns {any}
     */
    getQualifiedParentKeyName() {
        return this.$parent.qualifyColumn(this.$parentKey);
    }

    /**
     * getRelatedKeyName method.
     * @returns {any}
     */
    getRelatedKeyName() {
        return this.$relatedKey;
    }

    /**
     * getQualifiedRelatedKeyName method.
     * @returns {any}
     */
    getQualifiedRelatedKeyName() {
        return this.$related.qualifyColumn(this.$relatedKey);
    }

    /**
     * getTable method.
     * @returns {any}
     */
    getTable() {
        return this.$table;
    }

    /**
     * getRelationName method.
     * @returns {any}
     */
    getRelationName() {
        return this.$relationName;
    }

    /**
     * getPivotAccessor method.
     * @returns {any}
     */
    getPivotAccessor() {
        return this.$accessor;
    }

    /**
     * getPivotColumns method.
     * @returns {any}
     */
    getPivotColumns() {
        return this.$pivotColumns;
    }

    /**
     * qualifyPivotColumn method.
     * @param {*} $column
     * @returns {any}
     */
    qualifyPivotColumn($column) {
        return contains($column, '.') ?
            $column :
            this.$table + '.' + $column;
    }
}

module.exports = BelongsToMany
