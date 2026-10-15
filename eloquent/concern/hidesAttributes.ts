const { empty, is_array, value } = require('@ostro/support/function');
const { difference, union } = require('lodash');
/**
 * Class HidesAttributes.
 */
class HidesAttributes {

    $hidden = [];

    $visible = [];

    /**
     * getHidden method.
     * @returns {any}
     */
    getHidden() {
        return this.$hidden;
    }

    /**
     * setHidden method.
     * @param {*} $hidden
     * @returns {any}
     */
    setHidden($hidden: any) {
        this.$hidden = $hidden;

        return this;
    }

    /**
     * getVisible method.
     * @returns {any}
     */
    getVisible() {
        return this.$visible;
    }

    /**
     * setVisible method.
     * @param {*} $visible
     * @returns {any}
     */
    setVisible($visible: any) {
        this.$visible = $visible;
        return this;
    }

    /**
     * makeVisible method.
     * @param {*} $attributes
     * @returns {any}
     */
    makeVisible($attributes: Record<string, any>) {
        $attributes = Array.isArray($attributes) ? $attributes : Array.from(arguments);

        this.$hidden = difference(this.$hidden, $attributes);

        if (!empty(this.$visible)) {
            this.$visible = union(this.$visible, $attributes);
        }

        return this;
    }

    /**
     * makeVisibleIf method.
     * @param {*} $condition
     * @param {*} $attributes
     * @returns {any}
     */
    makeVisibleIf($condition: any, $attributes: Record<string, any>) {
        return value($condition, this) ? this.makeVisible($attributes) : this;
    }

    /**
     * makeHidden method.
     * @param {*} $attributes
     * @returns {any}
     */
    makeHidden($attributes: Record<string, any>) {
        $attributes = Array.isArray($attributes) ? $attributes : Array.from(arguments);
        this.$hidden = union(this.$hidden, $attributes);

        return this;
    }

    /**
     * makeHiddenIf method.
     * @param {*} $condition
     * @param {*} $attributes
     * @returns {any}
     */
    makeHiddenIf($condition: any, $attributes: Record<string, any>) {
        return value($condition, this) ? this.makeHidden($attributes) : this;
    }
}

module.exports = HidesAttributes