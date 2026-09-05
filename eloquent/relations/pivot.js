class Pivot {

    $foreignKey;

    $relatedKey;

    $attributes = {};

    $table;

    constructor(attributes = {}) {
        this.setRawAttributes(attributes);
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                return target.$attributes ? target.$attributes[prop] : undefined;
            },
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

    setTable(table) {
        this.$table = table;
        return this;
    }

    getTable() {
        return this.$table;
    }

    setRawAttributes(attributes, exists = false) {
        this.$attributes = Object.assign({}, attributes);
        this.$exists = exists;
        return this;
    }

    getAttributes() {
        return this.$attributes;
    }

    fill(attributes) {
        Object.assign(this.$attributes, attributes);
        return this;
    }

    isDirty() {
        return true;
    }

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

    async delete() {
        const Model = require('../model');
        const db = Model.getConnectionResolver();
        if (db && this.$table) {
            await db.table(this.$table).where(this.$attributes).delete();
        }
        return 1;
    }

    getDateFormat() {
        return 'YYYY-MM-DD HH:mm:ss';
    }

    setPivotKeys(foreignKey, relatedKey) {
        this.$foreignKey = foreignKey;
        this.$relatedKey = relatedKey;

        return this;
    }

    static fromRawAttributes(parent, attributes, table, exists = false) {
        const instance = new this();

        instance.setTable(table);
        instance.setRawAttributes(attributes, exists);

        return instance;
    }

    static fromAttributes(parent, attributes, table, exists = false) {
        const instance = new this();

        instance.setTable(table);
        instance.setRawAttributes(attributes, exists);

        return instance;
    }
}

module.exports = Pivot;
