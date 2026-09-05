const { empty, is_array, value } = require('@ostro/support/function');
const { difference, union } = require('lodash');
class HidesAttributes {

    $hidden = [];

    $visible = [];

    getHidden() {
        return this.$hidden;
    }

    setHidden($hidden) {
        this.$hidden = $hidden;

        return this;
    }

    getVisible() {
        return this.$visible;
    }

    setVisible($visible) {
        this.$visible = $visible;
        return this;
    }

    makeVisible($attributes) {
        $attributes = Array.isArray($attributes) ? $attributes : Array.from(arguments);

        this.$hidden = difference(this.$hidden, $attributes);

        if (!empty(this.$visible)) {
            this.$visible = union(this.$visible, $attributes);
        }

        return this;
    }

    makeVisibleIf($condition, $attributes) {
        return value($condition, this) ? this.makeVisible($attributes) : this;
    }

    makeHidden($attributes) {
        $attributes = Array.isArray($attributes) ? $attributes : Array.from(arguments);
        this.$hidden = union(this.$hidden, $attributes);

        return this;
    }

    makeHiddenIf($condition, $attributes) {
        return value($condition, this) ? this.makeHidden($attributes) : this;
    }
}

module.exports = HidesAttributes