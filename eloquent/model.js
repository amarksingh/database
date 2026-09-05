const { Macroable } = require('@ostro/support/macro')
const Query = require('../query/builder')
const MethodNotAvailable = require('@ostro/support/exceptions/methodNotAvailable')
const DateTime = require('@ostro/support/dateTime')
const GuardsAttributes = require('./concern/guardsAttributes')
const HasRelationships = require('./concern/hasRelationships')
const HidesAttributes = require('./concern/hidesAttributes')
const QueriesRelationships = require('./concern/queriesRelationships')
const HasAttributes = require('./concern/hasAttributes')
const HasTimestamps = require('./concern/hasTimestamps')
const BelongsToMany = require('./relations/belongsToMany')
const Relation = require('./relations/relation')
const RelationNotFoundException = require('./relationNotFoundException')
const ModelNotFoundException = require('./modelNotFoundException')
const kResolver = Symbol('resolver')
const kQuery = Symbol('query')
const kEagerLoad = Symbol('eagerLoad')
const kModel = Symbol('model')
const kScopes = Symbol('scopes')
const kRemovedScopes = Symbol('removeScopes')
const kWasRecentlyCreated = Symbol('wasRecentlyCreated')
const kPerformRelationQuery = Symbol('performRelationQuery')
const kLazyQueries = Symbol.for('lazyQueries')
const Collection = require('./collection')
const ModelInterface = require('@ostro/contracts/database/eloquent/model')
const { is_array, count, in_array, clone, isset, is_null, empty, implement, get_class, get_class_name, is_string, is_numeric } = require('@ostro/support/function')
const { snake, plural, studly, contains, startsWith } = require('@ostro/support/string')
const { intersection } = require('lodash')

class Model extends implement(ModelInterface, Query, GuardsAttributes, QueriesRelationships, HasRelationships, HasAttributes, HidesAttributes, HasTimestamps) {

	$table = plural(snake(this.constructor.name));

	get $query() {
		return this[kQuery] = this[kQuery] || Model.getConnectionResolver().table(this.$table)
	}
	set $query($value) {
		return this[kQuery] = $value
	}
	$connection = '';

	$primaryKey = 'id';

	$keyType = 'string';

	CREATED_AT = 'created_at';

	UPDATED_AT = 'updated_at';

	$incrementing = true;

	static [kResolver] = null;

	$exists = false;

	[kScopes] = {};
	[kRemovedScopes] = [];
	[kEagerLoad] = {};

	[kLazyQueries] = [];

	[kWasRecentlyCreated] = false;

	[kModel] = null;


	constructor($attributes = {}, newInstance = true) {
		super()
		Object.defineProperty(this, kQuery, { value: null, writable: true });
		const instance = newInstance == true ? this.newInstance($attributes, this.$exists, false) : this;
		if (instance.$fillable.length) {
			instance.fill($attributes);
		}

		return instance
	}

	raw() {
		return Model.getConnectionResolver().raw(...arguments)
	}

	getConnection() {

		return get_class(this).resolveConnection(this.getConnectionName());
	}

	getConnectionName() {
		return this.$connection;
	}

	setConnection($name) {

		this.$connection = $name;

		return this;
	}

	static resolveConnection($connection = null) {
		return this[kResolver].connection($connection);
	}

	static getConnectionResolver() {
		return this[kResolver];
	}

	static setConnectionResolver($resolver) {
		this[kResolver] = $resolver;
	}

	static unsetConnectionResolver() {
		this[kResolver] = null;
	}

	fillable(obj = {}) {
		let fillKeys = Object.keys(obj)
		let $massAssign = intersection(this.$fillable, fillKeys)
		if ($massAssign.length == 0 && fillKeys.length) {
			throw Error('Add column to fillable property to allow mass assignment on [' + this.constructor.name + '].')
		}
		for (let fillable of $massAssign) {
			if (obj.hasOwnProperty(fillable)) {
				let fn = this['set' + studly(fillable) + 'Attribute']
				if (typeof fn == 'function') {
					this['set' + studly(fillable) + 'Attribute'](obj[fillable])
				} else {
					this.setAttribute(fillable, obj[fillable])
				}
			}

		}

	}

	fill($attributes = {}) {
		let $totallyGuarded = this.totallyGuarded();
		let $fillableAttributes = this.fillableFromArray($attributes)
		for (let $key of $fillableAttributes) {
			let $value = $attributes[$key]
			if (this.isFillable($key)) {
				this.setAttribute($key, $value);
			} else if ($totallyGuarded) {
				throw new Error(
					`Add [${$key}] to fillable property to allow mass assignment on [${this.constructor.name}].`
				);
			}
		}

		return this;
	}

	addTimestampsToInsertValues(datas) {
		if (this.$timestamps == true) {
			let datetime = DateTime.now().format(this.$dateFormat);
			datas = !Array.isArray(datas) ? [datas] : datas;
			for (var i = 0; i < datas.length; i++) {
				datas[i][this.CREATED_AT] = datetime
				datas[i][this.UPDATED_AT] = datetime
			}
		}

	}

	updateInserdtId($datas, $ids) {
		const keys = this.getKeyName();
		for (var i = 0; i < $datas.length; i++) {
			let value = $ids[i];
			if (Array.isArray(keys)) {
				for (let key of keys) {
					if (typeof value == 'object') {
						value = value[key]
					}
					$datas[i][key] = value
				}
			} else {
				if (typeof value == 'object') {
					value = value[keys]
				}
				$datas[i][keys] = value
			}

		}
	}

	getTable() {
		return this.$table;
	}

	setTable($table) {
		this.$table = $table;
		return this;
	}

	getKeyName() {
		return this.$primaryKey;
	}

	setKeyName($key) {
		this.$primaryKey = $key;

		return this;
	}

	getKeyType() {
		return this.$keyType;
	}

	setKeyType($type) {
		this.$keyType = $type;

		return this;
	}

	getKey() {
		return this.getAttribute(this.getKeyName());
	}

	getQualifiedKeyName() {
		return this.qualifyColumn(this.getKeyName());
	}



	first() {
		this.$query.limit(1)
		// if (this.$attributes && Object.keys(this.$attributes).length) {
		// 	this.where(this.$attributes)
		// }
		return this.get().then(res => {
			if (res.length) {
				return res[0]
			}
			return null
		})

	}

	forceFill($attributes) {
		return this.constructor.unguarded(() => {
			return this.fill($attributes);
		});
	}

	addWhereExistsQuery($query, $boolean = 'and', $not = false) {
		let raw = $query && typeof $query.getQueryBuilder == 'function' ? $query.getQueryBuilder() : ($query && $query.$query ? $query.$query : $query);
		if ($boolean === 'or') {
			$not ? this.orWhereNotExists(raw) : this.orWhereExists(raw);
		} else {
			$not ? this.whereNotExists(raw) : this.whereExists(raw);
		}
		return this;
	}
	create(data = {}) {
		let isArray = Array.isArray(data);
		if (isArray && !data.length) {
			return new Collection([]);
		}
		let items = isArray ? data : [data];

		let instances = items.map(item => {
			if (typeof item != 'object' || item === null) {
				throw new Error('Only json object allowed');
			}
			let instance = this.newInstance();
			instance.fill(item);
			return instance;
		});

		let insertValues = instances.map(inst => inst.getAttributes());
		this.addTimestampsToInsertValues(insertValues);

		return this.$query.insert(insertValues).then(ids => {
			this.updateInserdtId(insertValues, ids);
			instances.forEach((inst, index) => {
				inst.setRawAttributes(insertValues[index], true);
				inst.$exists = true;
				inst.syncOriginal();
			});
			return isArray ? new Collection(instances) : instances[0];
		});
	}

	upsert(datas, $uniqueBy, $update = null) {

		throw Error('Under development')
	}

	async insert($values, $ids) {
		this.addTimestampsToInsertValues($values)
		let query = this.$query.insert($values)
		if ($ids) {
			query.returning($ids)
		}
		return query.then($ids => {
			this.updateInserdtId($values, $ids)
			return $values
		})
	}

	createSelectWithConstraint($name) {
		return [$name.split(':')[0], function ($query) {
			$query.select($name.split(':')[1].split(',').map(function ($column) {
				if (contains($column, '.')) {
					return $column;
				}

				return $query instanceof BelongsToMany ?
					$query.getRelated().getTable() + '.' + $column :
					$column;
			}));
		}];
	}

	parseWithRelations($relations) {
		let $results = {};
		$relations = Array.isArray($relations) ? { ...$relations } : $relations
		for (let $name in $relations) {
			let $constraints = $relations[$name]

			if (is_numeric($name)) {
				$name = $constraints;

				[$name, $constraints] = typeof $name === 'string' && $name.includes(':') ?
					this.createSelectWithConstraint($name) : [$name, function () { }];
			}

			$results = this.addNestedWiths($name, $results);
			$results[$name] = $constraints;
		}

		return $results;
	}

	addNestedWiths($name, $results = {}) {
		let $progress = [];

		for (let $segment of $name.split('.')) {
			$progress.push($segment);
			let $last = $progress.join('.')
			if (!isset($results[$last])) {
				$results[$last] = function () {
					//
				};
			}
		}

		return $results;
	}

	with($relations, $callback = null) {
		let $eagerLoad = null
		if (typeof $callback == 'function') {
			$eagerLoad = this.parseWithRelations({
				[$relations]: $callback
			});
		} else {
			$eagerLoad = this.parseWithRelations(is_string($relations) ? [...arguments] : $relations);
		}
		this[kEagerLoad] = Object.assign(this[kEagerLoad], $eagerLoad);

		return this;
	}

	defaultKeyName() {
		return this.getModel().getKeyName();
	}

	getModel() {
		return this[kModel] || this;
	}

	setModel($model) {
		this[kModel] = $model;

		this.$query.from($model.getTable());

		return this;
	}

	instanceValues($values) {
		return $values.map($value => {
			let $instance = this.newInstance()
			return $instance
		})
	}

	newInstance(attributes, $exists = false, newInstance = false) {

		let $model = new (this.constructor)(attributes, newInstance)
		$model.$exists = $exists;

		$model.setConnection(
			this.getConnectionName()
		);

		$model.setTable(this.getTable());
		return $model
	}

	newModelInstance($attributes) {
		const $instance = this.newInstance();
		$instance.fill($attributes);
		return $instance.setConnection(
			this.getConnection().getName()
		);
	}

	newModelQuery() {
		return this.newEloquentBuilder(
			this.newBaseQueryBuilder()
		).setModel(this);
	}

	newBaseQueryBuilder() {
		return Model.getConnectionResolver().table(this.$table)
	}

	newEloquentBuilder($query) {
		const $model = this.newInstance()
		$model.$query = $query
		return $model
	}

	hydrate($items) {

		let $instance = this.newInstance();
		let itemsArr = Array.isArray($items) ? $items : ($items && typeof $items.all === 'function' ? $items.all() : Object.values($items || {}));
		return $instance.newCollection(itemsArr.map(function ($item) {
			return $instance.newFromBuilder($item);
		}));
	}

	newCollection($data) {
		return Collection.collect($data || [])
	}

	async getModels() {
		return this.hydrate(
			await this.$query.get()
		);
	}

	newFromBuilder($attributes = {}, $connection = null) {
		let $model = this.newInstance({}, true, false);
		$model.setRawAttributes($attributes, true);
		$model.setConnection($connection || this.getConnectionName());

		return $model;
	}

	newQuery() {
		return this.newModelQuery();
	}

	newQueryWithoutRelationships() {
		return this.newModelQuery();
	}

	getQuery() {
		return this.$query
	}

	qualifyColumn($column) {
		if (contains($column, '.')) {
			return $column;
		}

		return this.getTable() + '.' + $column;
	}

	isNestedUnder($relation, $name) {
		return contains($name, '.') && startsWith($name, $relation + '.');
	}

	relationsNestedUnder($relation) {
		let $nested = {};

		for (let $name in this[kEagerLoad]) {
			let $constraints = this[kEagerLoad][$name]
			if (this.isNestedUnder($relation, $name)) {
				$nested[$name.substr(($relation + '.').length)] = $constraints;
			}
		}

		return $nested;
	}

	getForeignKey() {
		return snake(get_class_name(this)) + '_' + this.getKeyName();
	}

	getRelation($name) {

		let $relation = Relation.noConstraints(() => {
			let instance = this.getModel().newInstance()
			if (typeof instance[$name] != 'function') {
				throw RelationNotFoundException.make(this.getModel(), $name);
			}
			return instance[$name]()
		});

		let $nested = this.relationsNestedUnder($name);

		if (count($nested) > 0) {
			$relation.getQuery().with($nested);
		}

		return $relation;
	}

	toJSON() {
		return this.serialize()
	}

	serialize() {
		return this.toJson()
	}

	async eagerLoadRelation($models, $name, $constraints) {

		let $relation = this.getRelation($name);

		$relation.addEagerConstraints($models);

		$constraints($relation);
		$relation = await $relation.match(
			$relation.initRelation($models, $name),
			await $relation.getEager(),
			$name
		);
		return $relation;
	}

	async eagerLoadRelations($models) {
		for (let $name in this[kEagerLoad]) {
			let $constraints = this[kEagerLoad][$name]
			if (contains($name, '.') === false) {
				$models = await this.eagerLoadRelation($models, $name, $constraints);
			}
		}
		return $models;
	}

	clone() {
		const $model = this.newModelInstance();
		$model.$query.$query = this.getQuery().clone();
		$model.forceFill(clone(this.$attributes));
		return $model;

	}

	withAttributes(skipColumns = [], withTimestamp = false) {
		const $attributes = this.getAttributes();

		if (typeof skipColumns == "boolean") {
			withTimestamp = skipColumns;
			skipColumns = [];
		}
		if (withTimestamp === false) {
			skipColumns.push(this.CREATED_AT);
			skipColumns.push(this.UPDATED_AT);
		}
		const filteredAttributes = Object.keys($attributes).reduce((result, key) => {
			if (!skipColumns.includes(key)) {
				result[key] = $attributes[key];
			}
			return result;
		}, {});

		this.where(filteredAttributes);

		return this
	}

	async get() {
		let $models = await this.getModels();
		if ($models.length > 0) {
			$models = await this.eagerLoadRelations($models);

		}
		return $models
	}

	async save($options = {}) {
		let $saved = false

		let $query = this.newModelQuery();

		if (this.$exists) {
			$saved = this.isDirty() ?
				await this.performUpdate($query) : true;
		} else {
			$saved = await this.performInsert($query);
			let $connection = $query.getConnection()
			if (!this.getConnectionName() && $connection) {
				this.setConnection($connection.getName());
			}
		}

		if ($saved) {
			this.finishSave($options);
			await this[kPerformRelationQuery]()
		}

		return $saved;
	}

	finishSave($options = {}) {

		if (this.isDirty() && ($options['touch'] || true)) {
			this.touchOwners();
		}

		this.syncOriginal();
	}

	async performUpdate($query) {

		if (this.usesTimestamps()) {
			this.updateTimestamps();
		}

		let $dirty = this.getDirty();

		if (count($dirty) > 0) {
			await this.setKeysForSaveQuery($query).update($dirty);

			this.syncChanges();
		}

		return true;
	}

	setKeysForSaveQuery($query) {
		const keys = this.getKeyName();
		const obj = {

		};
		if (Array.isArray(keys)) {
			for (let key of keys) {
				obj[key] = this.getKeyForSaveQuery(key)
			}
		} else {
			obj[keys] = this.getKeyForSaveQuery()
		}
		$query.where(obj);

		return $query;
	}


	getKeyForSaveQuery(key) {
		return this.getOriginal(key || this.getKeyName()) || this.getKey();
	}

	getIncrementing() {
		return this.$incrementing;
	}

	async insertAndSetId($query, $attributes) {
		let $keyName = this.getKeyName();
		const $id = await $query.insert([$attributes], $keyName);
		if (Array.isArray($keyName)) {
			for (let key of $keyName) {
				this.setAttribute(key, $id[0][key]);
			}
			return this;
		} else {
			const idVal = Array.isArray($id) && typeof $id[0] === 'object' && $id[0] !== null ? $id[0][$keyName] : (Array.isArray($id) ? $id[0] : $id);
			return this.setAttribute($keyName, idVal);
		}

	}

	async performInsert($query) {
		if (this.usesTimestamps()) {
			this.updateTimestamps();
		}

		let $attributes = this.getAttributesForInsert();

		if (this.getIncrementing()) {
			await this.insertAndSetId($query, $attributes);
		} else {
			if (empty($attributes)) {
				return true;
			}

			await $query.getQuery().insert($attributes);
		}

		this.$exists = true;

		this[kWasRecentlyCreated] = true;

		return true;
	}

	[kPerformRelationQuery]() {
		return Promise.all(this[kLazyQueries].map(fn => fn()))
	}

	setLazyQuery(fn) {
		if (Array.isArray(fn)) {
			return this[kLazyQueries] = this[kLazyQueries].concat(fn)
		}
		return this[kLazyQueries].push(fn)
	}

	whereKey($id) {
		if ($id instanceof Model) {
			$id = $id.getKey();
		}

		if (is_array($id)) {
			if (in_array(this.getModel().getKeyType(), ['int', 'integer']) && typeof this.$query.whereIntegerInRaw === 'function') {
				this.$query.whereIntegerInRaw(this.getModel().getQualifiedKeyName(), $id);
			} else {
				this.$query.whereIn(this.getModel().getQualifiedKeyName(), $id);
			}

			return this;
		}

		if ($id !== null && this.getModel().getKeyType() === 'string') {
			$id = $id.toString();
		}

		return this.where(this.getModel().getQualifiedKeyName(), '=', $id);
	}

	whereKeyNot($id) {
		if ($id instanceof Model) {
			$id = $id.getKey();
		}

		if (is_array($id)) {
			if (in_array(this.getModel().getKeyType(), ['int', 'integer']) && typeof this.$query.whereIntegerNotInRaw === 'function') {
				this.$query.whereIntegerNotInRaw(this.getModel().getQualifiedKeyName(), $id);
			} else {
				this.$query.whereNotIn(this.getModel().getQualifiedKeyName(), $id);
			}

			return this;
		}

		if ($id !== null && this.getModel().getKeyType() === 'string') {
			$id = $id.toString();
		}

		return this.where(this.getModel().getQualifiedKeyName(), '!=', $id);
	}

	destroy(id) {
		let where = {
			[this.$primaryKey]: id
		}
		this.where(where)
		return this.delete();
	}

	async delete() {
		if (is_null(this.getKeyName())) {
			throw new Error('No primary key defined on model.');
		}

		this.touchOwners();

		await this.performDeleteOnModel();

		return true;

	}

	async performDeleteOnModel() {
		if (Object.keys(this.getAttributes()).length) {
			if (this.$primaryKey in this.getAttributes()) {
				let where = {
					[this.$primaryKey]: this.getAttribute(this.$primaryKey)
				}
				this.where(where)
				await this.$query.delete();
			}
		} else {
			await this.$query.delete()
		}

		this.$exists = false;
	}

	async firstOrNew($attributes = {}, $values = {}) {
		const $instance = await this.where($attributes).first()
		if (!is_null($instance)) {
			return $instance;
		}

		return this.newModelInstance(Object.assign($attributes, $values));
	}

	async findOrFail($id = [], $columns = ['*']) {
		const $result = await this.find($id, $columns);


		if (is_array($id)) {
			if (!$result || count($result) !== count($id.unique())) {
				throw (new ModelNotFoundException).setModel(
					get_class(this.getModel()), $id.difference($result && $result.modelKeys())
				);
			}

			return $result;
		}

		if (is_null($result)) {
			throw (new ModelNotFoundException).setModel(
				get_class(this.getModel()), [$id]
			);
		}

		return $result;
	}

	async findOrNew($id, $columns = ['*']) {
		const $model = await this.find($id, $columns);
		if (!is_null($model)) {
			return $model;
		}

		return this.newModelInstance();
	}

	async findOr($id, $columns = ['*'], $callback = null) {
		if (typeof $columns == 'function') {
			$callback = $columns;

			$columns = ['*'];
		}
		const $model = await this.find($id, $columns)
		if (!is_null($model)) {
			return $model;
		}

		return $callback();
	}

	async firstOrFail($columns = ['*']) {
		const $model = await this.first($columns);
		if (!is_null($model)) {
			return $model;
		}

		throw (new ModelNotFoundException).setModel(get_class(this.getModel()));
	}

	firstOrCreate(where, create = {}) {
		return this.where(where).first().then(res => {
			if (!res) {
				return this.create({ ...where, ...create })
			}
			return res
		})
	}
	async firstOr($columns = ['*'], $callback = null) {
		if (typeof $columns == 'function') {
			$callback = $columns;

			$columns = ['*'];
		}
		const $model = await this.first($columns)
		if (!is_null($model)) {
			return $model;
		}

		return $callback();
	}

	updateOrCreate(where = {}, update = {}) {
		return this.where(where).first().then(async res => {
			if (res) {
				await res.fill(update).save();
				return res;
			}

			return this.create({ ...where, ...update })
		})
	}

	find($id) {
		if (!this.$primaryKey) {
			throw Error('No primary key defined on model');
		}
		return this.where({
			[this.$primaryKey]: $id
		}).first()

	}

	withSavepointIfNeeded($scope) {
		return $scope()
	}

	callScope($scope, $parameters = []) {
		$parameters.unshift(this);
		const $query = this.getQuery();
		const statements = ($query && $query._statements) || [];
		const wheres = statements.filter(s => s.type == 'where');
		const $originalWhereCount = count(wheres);

		const $result = typeof $scope === 'function' ? ($scope(...$parameters) || this) : this;
		return $result;
	}


	withoutGlobalScopes($scopes = null) {
		if (!is_array($scopes)) {
			$scopes = Object.keys(this[kScopes] || {});
		}

		for (const $scope of $scopes) {
			this.withoutGlobalScope($scope);
		}

		return this;
	}
	withGlobalScope($identifier, $scope) {
		if (!this[kScopes]) {
			this[kScopes] = {};
		}
		this[kScopes][$identifier] = $scope;

		if ($scope && typeof $scope.extend === 'function') {
			$scope.extend(this);
		}

		return this;
	}

	withoutGlobalScope($scope) {
		if (!is_string($scope)) {
			$scope = get_class($scope);
		}
		delete this[kScopes][$scope];

		this[kRemovedScopes].push($scope);

		return this;
	}

	removedScopes() {
		return this[kRemovedScopes];
	}

	toBase() {
		return this.getQuery();
	}

	toArray() {
		return this.attributesToJson();
	}

	toJson() {
		return this.attributesToJson();
	}

	async fresh($columns = ['*']) {
		if (!this.$exists) {
			return null;
		}
		return (new this.constructor).where(this.getKeyName(), this.getKey()).first($columns);
	}

	async refresh() {
		if (!this.$exists) {
			return this;
		}
		const fresh = await (new this.constructor).where(this.getKeyName(), this.getKey()).first();
		if (fresh) {
			this.setRawAttributes(fresh.getAttributes(), true);
		}
		return this;
	}

	__set(target, key, value) {
		if (typeof key == 'symbol') {
			return target[key] = value
		}
		return target.setAttribute(key, value)
	}

	__get(target, key, receiver) {
		const self = receiver || target;
		if (typeof target[key] === 'function') {
			return target[key].bind(self);
		}
		let scopeMethod = 'scope' + studly(key);
		if (typeof target[scopeMethod] === 'function') {
			return (...args) => target[scopeMethod](self, ...args) || self;
		}
		return target.getAttribute(key);
	}

	__call(target, method, args) {
		if (typeof target[method] == 'function') {
			return target[method](...args);
		}
		let scopeMethod = 'scope' + studly(method);
		if (typeof target[scopeMethod] == 'function') {
			let res = target[scopeMethod](target, ...args);
			return (typeof res !== 'undefined') ? res : target;
		}
		if (target.$query && typeof target.$query[method] == 'function') {
			return target.$query[method](...args);
		}
		throw new MethodNotAvailable('Method [' + method + '] was not available on [' + target.constructor.name + ']');
	}

	static __call(target, method, args) {

		let instance = Macroable(new target())

		if (typeof instance[method] == 'function') {
			return instance[method](...args)
		}

		let scopeMethod = 'scope' + studly(method);
		if (typeof instance[scopeMethod] == 'function') {
			let res = instance[scopeMethod](instance, ...args);
			return (typeof res !== 'undefined') ? res : instance;
		}

		throw new MethodNotAvailable('Method [' + method + '] was not available on [' + instance.constructor.name + ']')
	}

}

module.exports = Macroable(Model)
