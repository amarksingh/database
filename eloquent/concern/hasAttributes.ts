const { isset, is_null, count, empty, method_exists, collect } = require('@ostro/support/function')
const { studly, snake, lowerFirst } = require('@ostro/support/string')
const CollectionInterface = require('@ostro/contracts/collection/collect')
const ModelInterface = require('@ostro/contracts/database/eloquent/model')
const { omit, pick } = require('lodash')
/**
 * Class HasAttributes.
 */
class HasAttributes {

    static $mutatorCache = {};

    $attributes = {};

    $original = {};

    $changes = {};

    $casts = {};

    $classCastCache = [];

    static $primitiveCastTypes = [
        'array',
        'bool',
        'boolean',
        'collection',
        'custom_datetime',
        'date',
        'datetime',
        'decimal',
        'double',
        'encrypted',
        'encrypted:array',
        'encrypted:collection',
        'encrypted:json',
        'encrypted:object',
        'float',
        'int',
        'integer',
        'json',
        'object',
        'real',
        'string',
        'timestamp',
    ];

    $dates = [];

    $dateFormat = 'yyyy-MM-dd HH:mm:ss';

    $appends = {};

    static $snakeAttributes = true;

    static $encrypter;

    /**
     * attributesToJson method.
     * @returns {any}
     */
    attributesToJson() {
        let $attributes = { ...this.getJsonableAttributes(), ...this.getJsonableAppends() }
        let $mutatedAttributes = this.getMutatedAttributes()
        for (let $key of $mutatedAttributes) {
            if (this.$attributes.hasOwnProperty($key)) {
                $attributes[$key] = this.getAttributeValue($key);
            }
        }
        $attributes = this.getJsonableItems($attributes);
        let jsonableRelations = this.getJsonableableRelations()
        for (let $key in jsonableRelations) {
            let $value = jsonableRelations[$key]
            if ($value instanceof CollectionInterface) {
                $attributes[$key] = $value.toArray()
            } else if ($value instanceof ModelInterface) {
                $attributes[$key] = $value.toJson()
            }
        }

        return $attributes;
    }

    /**
     * getJsonableAttributes method.
     * @returns {any}
     */
    getJsonableAttributes() {
        return this.getJsonableItems(this.getAttributes());
    }

    /**
     * getJsonableAppends method.
     * @returns {any}
     */
    getJsonableAppends() {
        if (!count(this.$appends)) {
            return [];
        }

        return this.getJsonableItems(this.$appends);
    }

    /**
     * getJsonableItems method.
     * @param {*} $values
     * @returns {any}
     */
    getJsonableItems($values) {
        if (count(this.getVisible()) > 0) {
            $values = pick($values, this.getVisible());
        }

        if (count(this.getHidden()) > 0) {
            $values = omit($values, this.getHidden())
        }

        return $values;
    }

    /**
     * mutateAttributeForJSON method.
     * @param {*} $key
     * @param {*} $value
     * @returns {any}
     */
    mutateAttributeForJSON($key, $value) {
        $value = this.mutateAttribute($key, $value);
        if ($value instanceof CollectionInterface) {
            return $value.toArray()
        } else if ($value instanceof ModelInterface) {
            return $value.toJson()
        }
        return $value;
    }

    /**
     * getRelationValue method.
     * @param {*} $key
     * @returns {any}
     */
    getRelationValue($key) {
        if (this.relationLoaded($key)) {
            return this.getRelations()[$key];
        }
    }

    /**
     * relationsToJson method.
     * @returns {any}
     */
    relationsToJson() {
        let $attributes = {};
        let jsonableRelations = this.getJsonableableRelations()
        for (let $key in jsonableRelations) {
            let $value = jsonableRelations[$key];
            let $relation;

            if ($value instanceof CollectionInterface) {
                $relation = $value.toArray();
            } else if (is_null($value)) {
                $relation = $value;
            }
            if (this.constructor.$snakeAttributes) {
                $key = snake($key);
            }

            if (isset($relation) || is_null($value)) {
                $attributes[$key] = $relation;
            }
        }

        return $attributes;
    }

    /**
     * getJsonableableRelations method.
     * @returns {any}
     */
    getJsonableableRelations() {
        return this.getJsonableItems(this.getRelations());
    }


    /**
     * addMutatedAttributesToJSON method.
     * @param {*} $attributes
     * @param {*} $mutatedAttributes
     * @returns {any}
     */
    addMutatedAttributesToJSON($attributes, $mutatedAttributes) {
        for (let $key of $mutatedAttributes) {

            if (!$attributes.hasOwnProperty($key)) {
                continue;
            }

            $attributes[$key] = this.mutateAttributeForJSON(
                $key, $attributes[$key]
            );
        }

        return $attributes;
    }

    /**
     * setRawAttributes method.
     * @param {*} $attributes
     * @param {*} $sync
     * @returns {any}
     */
    setRawAttributes($attributes, $sync = false) {
        this.$attributes = $attributes;

        if ($sync) {
            this.syncOriginal();
        }

        return this;
    }

    /**
     * syncOriginal method.
     * @returns {any}
     */
    syncOriginal() {

        this.$original = { ...this.getAttributes() }
    }

    /**
     * getOriginal method.
     * @param {*} key
     * @returns {any}
     */
    getOriginal(key) {
        return this.$original[key];
    }

    /**
     * getAttributes method.
     * @returns {any}
     */
    getAttributes() {

        return this.$attributes;
    }

    /**
     * getAttribute method.
     * @param {*} $key
     * @returns {any}
     */
    getAttribute($key) {
        if (!$key) {
            return;
        } else if (this.$attributes.hasOwnProperty($key) || this.hasGetMutator($key)) {
            return this.getAttributeValue($key);
        } else if (typeof this[$key] === 'function') {
            return;
        }

        return this.getRelationValue($key);
    }

    /**
     * setAttribute method.
     * @param {*} $key
     * @param {*} value
     * @returns {any}
     */
    setAttribute($key, value) {
        if (this.hasSetMutator($key)) {
            return this.setMutatedAttributeValue($key, value);
        }
        return this.$attributes[$key] = value

    }

    /**
     * getAttributesForInsert method.
     * @returns {any}
     */
    getAttributesForInsert() {
        return this.getAttributes();
    }

    /**
     * isDirty method.
     * @param {*} $attributes
     * @returns {any}
     */
    isDirty($attributes = null) {
        const attrs = Array.isArray($attributes) ? $attributes : (arguments.length === 1 && typeof $attributes === 'string' ? [$attributes] : Array.from(arguments));
        return this.hasChanges(
            this.getDirty(), attrs
        );
    }

    /**
     * isClean method.
     * @param {*} $attributes
     * @returns {any}
     */
    isClean($attributes = null) {
        return !this.isDirty(...arguments);
    }

    /**
     * hasChanges method.
     * @param {*} $changes
     * @param {*} $attributes
     * @returns {any}
     */
    hasChanges($changes, $attributes = null) {

        if (empty($attributes)) {
            return count($changes) > 0;
        }

        for (let $attribute of $attributes) {
            if ($changes.hasOwnProperty($attribute)) {
                return true;
            }
        }

        return false;
    }

    /**
     * getDirty method.
     * @returns {any}
     */
    getDirty() {
        let $dirty = {};
        let $attributes = this.getAttributes()

        for (let $key in $attributes) {
            let $value = $attributes[$key]

            if (!this.originalIsEquivalent($key)) {
                $dirty[$key] = $value;
            }
        }

        return $dirty;
    }

    /**
     * getChanges method.
     * @returns {any}
     */
    getChanges() {
        return this.$changes;
    }

    /**
     * originalIsEquivalent method.
     * @param {*} $key
     * @returns {any}
     */
    originalIsEquivalent($key) {
        if (!this.$original.hasOwnProperty($key)) {
            return false;
        }

        let $attribute = this.$attributes[$key];
        let $original = this.$original[$key];

        if ($attribute === $original) {
            return true;
        } else if (is_null($attribute)) {
            return false;
        }

        return $attribute == $original;
    }

    /**
     * hasGetMutator method.
     * @param {*} $key
     * @returns {any}
     */
    hasGetMutator($key) {
        return method_exists(this, 'get' + studly($key) + 'Attribute');
    }

    /**
     * mutateAttribute method.
     * @param {*} $key
     * @param {*} $value
     * @returns {any}
     */
    mutateAttribute($key, $value) {
        return this['get' + studly($key) + 'Attribute']($value);
    }

    /**
     * hasSetMutator method.
     * @param {*} $key
     * @returns {any}
     */
    hasSetMutator($key) {
        return method_exists(this, 'set' + studly($key) + 'Attribute');
    }

    /**
     * setMutatedAttributeValue method.
     * @param {*} $key
     * @param {*} $value
     * @returns {any}
     */
    setMutatedAttributeValue($key, $value) {
        return this['set' + studly($key) + 'Attribute']($value);
    }

    /**
     * hasCast method.
     * @param {*} $key
     * @returns {any}
     */
    hasCast($key) {
        return this.$casts && this.$casts.hasOwnProperty($key);
    }

    /**
     * getCasts method.
     * @returns {any}
     */
    getCasts() {
        return this.$casts || {};
    }

    /**
     * castAttribute method.
     * @param {*} $key
     * @param {*} $value
     * @returns {any}
     */
    castAttribute($key, $value) {
        if ($value === null || $value === undefined) {
            return $value;
        }
        let castType = this.$casts[$key];
        switch (castType) {
            case 'int':
            case 'integer':
                return parseInt($value, 10);
            case 'real':
            case 'float':
            case 'double':
                return parseFloat($value);
            case 'string':
                return String($value);
            case 'bool':
            case 'boolean':
                return Boolean($value);
            case 'object':
            case 'json':
            case 'array':
                return typeof $value === 'string' ? JSON.parse($value) : $value;
            default:
                return $value;
        }
    }

    /**
     * transformModelValue method.
     * @param {*} $key
     * @param {*} $value
     * @returns {any}
     */
    transformModelValue($key, $value) {

        if (this.hasGetMutator($key)) {
            return this.mutateAttribute($key, $value);
        }

        if (this.hasCast($key)) {
            return this.castAttribute($key, $value);
        }

        return $value;
    }

    /**
     * getAttributeFromObject method.
     * @param {*} $key
     * @returns {any}
     */
    getAttributeFromObject($key) {
        return this.getAttributes()[$key];
    }

    /**
     * getAttributeValue method.
     * @param {*} $key
     * @returns {any}
     */
    getAttributeValue($key) {
        return this.transformModelValue($key, this.getAttributeFromObject($key));
    }

    /**
     * getMutatedAttributes method.
     * @returns {any}
     */
    getMutatedAttributes() {
        let $class = Object.getPrototypeOf(this).constructor;

        if (!isset(HasAttributes.$mutatorCache[$class.name])) {
            $class.cacheMutatedAttributes($class);
        }
        return HasAttributes.$mutatorCache[$class.name];
    }

    /**
     * syncChanges method.
     * @returns {any}
     */
    syncChanges() {
        this.$changes = this.getDirty();

        return this;
    }

    /**
     * cacheMutatedAttributes method.
     * @static
     * @param {*} $class
     * @returns {any}
     */
    static cacheMutatedAttributes($class) {
        HasAttributes.$mutatorCache[$class.name] = collect(this.getMutatorMethods($class)).map(($match) => {
            return lowerFirst(this.$snakeAttributes ? snake($match) : $match);
        }).all();
    }

    /**
     * getMutatorMethods method.
     * @static
     * @param {*} $class
     * @returns {any}
     */
    static getMutatorMethods($class) {
        let $matches = [...(Object.getOwnPropertyNames($class.prototype).join(';')).matchAll(/(?<=^|;)get([^;]+?)Attribute(;|$)/g)];

        return $matches.map(arr => arr[1]);
    }

}

module.exports = HasAttributes
