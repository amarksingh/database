const { is_object } = require('@ostro/support/function');
class InteractsWithDictionary {

    getDictionaryKey($attribute) {
        if ($attribute != null && is_object($attribute)) {
            if (typeof $attribute.toString === 'function' && $attribute.toString !== Object.prototype.toString) {
                return $attribute.toString();
            }
            throw new Error('Model attribute value is an object but does not have a __toString method.');
        }

        return $attribute;
    }
}

module.exports = InteractsWithDictionary