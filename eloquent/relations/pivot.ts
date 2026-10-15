/**
 * Class Pivot.
 */
class Pivot {

    $foreignKey;

    $relatedKey;

    $attributes = {};

    $table;

    /**
     * Create a new instance.
     * @param {*} attributes
     */
    constructor(attributes = {}) {
        this.setRawAttributes(attributes);
        return new Proxy(this, {
            /**
             * get method.
             * @param {*} target
             * @param {*} prop
             * @param {*} receiver
             * @returns {any}
             */
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                return target.$attributes ? target.$attributes[prop] : undefined;
            },
            /**
             * set method.
             * @param {*} target
             * @param {*} prop
             * @param {*} value
             * @param {*} receiver
             * @returns {any}
             */
            set(target, prop, value, receiver) {
                if (prop in target || typeof prop === 'symbol') {
                    return Reflect.set(target, prop, value, receiver);
                }
                target.$attributes = target.$attributes || {};
                target.$attributes[prop] = value;
                return true;
            }
        });
    }

    /**
     * setTable method.
     * @param {*} table
     * @returns {any}
     */
    setTable(table) {
        this.$table = table;
        return this;
    }

    /**
     * getTable method.
     * @returns {any}
     */
    getTable() {
        return this.$table;
    }

    /**
     * setRawAttributes method.
     * @param {*} attributes
     * @param {*} exists
     * @returns {any}
     */
    setRawAttributes(attributes, exists = false) {
        this.$attributes = Object.assign({}, attributes);
        this.$exists = exists;
        return this;
    }

    /**
     * getAttributes method.
     * @returns {any}
     */
    getAttributes() {
        return this.$attributes;
    }

    /**
     * fill method.
     * @param {*} attributes
     * @returns {any}
     */
    fill(attributes) {
        Object.assign(this.$attributes, attributes);
        return this;
    }

    /**
     * isDirty method.
     * @returns {any}
     */
    isDirty() {
        return true;
    }

    /**
     * save method.
     * @async
     * @returns {any}
     */
    async save() {
        const Model = require('../model');
        const db = Model.getConnectionResolver();
        if (db && this.$table) {
            if (this.$exists) {
                await db.table(this.$table).where(this.$attributes).update(this.$attributes);
            } else {
                await db.table(this.$table).insert(this.$attributes);
                this.$exists = true;
            }
        }
        return true;
    }

    /**
     * delete method.
     * @async
     * @returns {any}
     */
    async delete() {
        const Model = require('../model');
        const db = Model.getConnectionResolver();
        if (db && this.$table) {
            await db.table(this.$table).where(this.$attributes).delete();
        }
        return 1;
    }

    /**
     * getDateFormat method.
     * @returns {any}
     */
    getDateFormat() {
        return 'YYYY-MM-DD HH:mm:ss';
    }

    /**
     * setPivotKeys method.
     * @param {*} foreignKey
     * @param {*} relatedKey
     * @returns {any}
     */
    setPivotKeys(foreignKey, relatedKey) {
        this.$foreignKey = foreignKey;
        this.$relatedKey = relatedKey;

        return this;
    }

    /**
     * fromRawAttributes method.
     * @static
     * @param {*} parent
     * @param {*} attributes
     * @param {*} table
     * @param {*} exists
     * @returns {any}
     */
    static fromRawAttributes(parent, attributes, table, exists = false) {
        const instance = new this();

        instance.setTable(table);
        instance.setRawAttributes(attributes, exists);

        return instance;
    }

    /**
     * fromAttributes method.
     * @static
     * @param {*} parent
     * @param {*} attributes
     * @param {*} table
     * @param {*} exists
     * @returns {any}
     */
    static fromAttributes(parent, attributes, table, exists = false) {
        const instance = new this();

        instance.setTable(table);
        instance.setRawAttributes(attributes, exists);

        return instance;
    }
}

module.exports = Pivot;
