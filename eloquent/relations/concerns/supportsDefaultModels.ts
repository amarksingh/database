const { is_callable } = require('@ostro/support/function');
const kWithDefault = Symbol('withDefault')
class SupportsDefaultModels {

    $withDefault = null;

    withDefault($callback = true) {
        this.$withDefault = $callback;

        return this;
    }

    getDefaultFor($parent) {
        if (!this.$withDefault) {
            return;
        }

        let $instance = this.newRelatedInstanceFor($parent);

        if (is_callable(this.$withDefault)) {
            return this.$withDefault.call($instance, $parent) || $instance;
        }

        if (typeof this.$withDefault === 'object' && this.$withDefault !== null) {
            $instance.forceFill(this.$withDefault);
        }

        return $instance;
    }
}

module.exports = SupportsDefaultModels