const { get_class_name, isset, empty, count } = require('@ostro/support/function')
const { intersection } = require('lodash')
class GuardsAttributes {
    $fillable = [];

    $guarded = ['*'];

    static $unguarded = false;

    static $guardableColumns = [];
    getFillable() {
        return this.$fillable;
    }

    fillableData($values) {
        const datas = [];
        if (!Array.isArray($values)) {
            $values = [$values]
        }
        for (let obj of $values) {
            const keys = Object.keys(obj);
            const fillableData = {};
            for (let key of keys) {
                if (this.isFillable(key)) {
                    fillableData[key] = obj[key];
                }
            }
            datas.push(fillableData)
        }
        return datas;
    }

    fillable($fillable) {
        this.$fillable = $fillable;

        return this;
    }

    mergeFillable($fillable) {
        this.$fillable = this.$fillable.concat($fillable);

        return this;
    }

    getGuarded() {
        return this.$guarded === false ? [] :
            this.$guarded;
    }

    guard($guarded) {
        this.$guarded = $guarded;

        return this;
    }

    mergeGuarded($guarded) {
        this.$guarded = this.$guarded.concat($guarded);

        return this;
    }

    unguard($state = true) {
        this.constructor.$unguarded = $state;
    }

    reguard() {
        this.constructor.$unguarded = false;
    }

    isUnguarded() {
        return this.constructor.$unguarded;
    }

    unguarded($callback) {
        if (this.constructor.$unguarded) {
            return $callback();
        }

        this.unguard();

        try {
            return $callback();
        } finally {
            this.reguard();
        }
    }

    isFillable($key) {
        if (this.constructor.$unguarded) {
            return true;
        }

        if (this.getFillable().indexOf($key) > -1) {
            return true;
        }

        if (this.isGuarded($key)) {
            return false;
        }

        return empty(this.getFillable()) &&
            $key.includes('.') &&
            !$key.startsWith('_');
    }

    isGuarded($key) {
        if (empty(this.getGuarded())) {
            return false;
        }
        const escapedKey = $key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp('^' + escapedKey + '$', 'i');

        return this.getGuarded().toString() === ['*'].toString() ||
            !empty(this.getGuarded().filter(item => reg.test(item)));
    }

    async isGuardableColumn($key) {
        const className = get_class_name(this);
        if (!isset(this.constructor.$guardableColumns[className])) {
            this.constructor.$guardableColumns[className] = await this.getConnection()
                .getColumnListing(this.getTable());
        }

        return this.constructor.$guardableColumns[className].indexOf($key) > -1;
    }

    totallyGuarded() {
        return count(this.getFillable()) === 0 && this.getGuarded().toString() === ['*'].toString();
    }

    fillableFromArray($attributes) {
        if (count(this.getFillable()) > 0 && !this.constructor.$unguarded) {
            return intersection(this.getFillable(), Object.keys($attributes));
        }

        return Object.keys($attributes);
    }
}
module.exports = GuardsAttributes
