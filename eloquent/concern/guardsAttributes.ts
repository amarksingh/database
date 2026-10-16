import { get_class_name, isset, empty, count } from '@ostro/support/function';
import { intersection } from 'lodash';
/**
 * Class GuardsAttributes.
 */
class GuardsAttributes {
    [key: string]: any;
    $fillable = [];

    $guarded = ['*'];

    static $unguarded = false;

    static $guardableColumns = [];
    /**
     * getFillable method.
     * @returns {any}
     */
    getFillable() {
        return this.$fillable;
    }

    /**
     * fillableData method.
     * @param {*} $values
     * @returns {any}
     */
    fillableData($values: any) {
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

    /**
     * fillable method.
     * @param {*} $fillable
     * @returns {any}
     */
    fillable($fillable: any) {
        this.$fillable = $fillable;

        return this;
    }

    /**
     * mergeFillable method.
     * @param {*} $fillable
     * @returns {any}
     */
    mergeFillable($fillable: any) {
        this.$fillable = this.$fillable.concat($fillable);

        return this;
    }

    /**
     * getGuarded method.
     * @returns {any}
     */
    getGuarded() {
        return (this.$guarded as any) === false ? [] :
            this.$guarded;
    }

    /**
     * guard method.
     * @param {*} $guarded
     * @returns {any}
     */
    guard($guarded: any) {
        this.$guarded = $guarded;

        return this;
    }

    /**
     * mergeGuarded method.
     * @param {*} $guarded
     * @returns {any}
     */
    mergeGuarded($guarded: any) {
        this.$guarded = this.$guarded.concat($guarded);

        return this;
    }

    /**
     * unguard method.
     * @param {*} $state
     * @returns {any}
     */
    unguard($state: boolean = true) {
        (this.constructor as any).$unguarded = $state;
    }

    /**
     * reguard method.
     * @returns {any}
     */
    reguard() {
        (this.constructor as any).$unguarded = false;
    }

    /**
     * isUnguarded method.
     * @returns {any}
     */
    isUnguarded() {
        return (this.constructor as any).$unguarded;
    }

    /**
     * unguarded method.
     * @param {*} $callback
     * @returns {any}
     */
    unguarded($callback: Function) {
        if ((this.constructor as any).$unguarded) {
            return $callback();
        }

        this.unguard();

        try {
            return $callback();
        } finally {
            this.reguard();
        }
    }

    /**
     * isFillable method.
     * @param {*} $key
     * @returns {any}
     */
    isFillable($key: string) {
        if ((this.constructor as any).$unguarded) {
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

    /**
     * isGuarded method.
     * @param {*} $key
     * @returns {any}
     */
    isGuarded($key: string) {
        if (empty(this.getGuarded())) {
            return false;
        }
        const escapedKey = $key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp('^' + escapedKey + '$', 'i');

        return this.getGuarded().toString() === ['*'].toString() ||
            !empty(this.getGuarded().filter(item => reg.test(item)));
    }

    /**
     * isGuardableColumn method.
     * @async
     * @param {*} $key
     * @returns {any}
     */
    async isGuardableColumn($key: string) {
        const className = get_class_name(this);
        if (!isset((this.constructor as any).$guardableColumns[className])) {
            (this.constructor as any).$guardableColumns[className] = await this.getConnection()
                .getColumnListing(this.getTable());
        }

        return (this.constructor as any).$guardableColumns[className].indexOf($key) > -1;
    }

    /**
     * totallyGuarded method.
     * @returns {any}
     */
    totallyGuarded() {
        return count(this.getFillable()) === 0 && this.getGuarded().toString() === ['*'].toString();
    }

    /**
     * fillableFromArray method.
     * @param {*} $attributes
     * @returns {any}
     */
    fillableFromArray($attributes: Record<string, any>) {
        if (count(this.getFillable()) > 0 && !(this.constructor as any).$unguarded) {
            return intersection(this.getFillable(), Object.keys($attributes));
        }

        return Object.keys($attributes);
    }
}

export default GuardsAttributes;
