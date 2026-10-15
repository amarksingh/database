/**
 * Class HasGlobalScopes.
 */
class HasGlobalScopes {

    /**
     * addGlobalScope method.
     * @param {*} $scope
     * @param {*} $implementation
     * @returns {any}
     */
    addGlobalScope($scope: any, $implementation: any = null) {
        if (is_string($scope) && !is_null($implementation)) {
            return this.constructor.$globalScopes[this.constructor.class][$scope] = $implementation;
        } else if (typeof $scope == 'function') {
            return this.constructor.$globalScopes[this.constructor.class][spl_object_hash($scope)] = $scope;
        } else if ($scope instanceof Scope) {
            return this.constructor.$globalScopes[this.constructor.class][get_class($scope)] = $scope;
        }

        throw new InvalidArgumentException('Global scope must be an instance of Closure or Scope.');
    }

    /**
     * hasGlobalScope method.
     * @param {*} $scope
     * @returns {any}
     */
    hasGlobalScope($scope: any) {
        return !is_null(this.constructor.getGlobalScope($scope));
    }

    /**
     * getGlobalScope method.
     * @param {*} $scope
     * @returns {any}
     */
    getGlobalScope($scope: any) {
        if (is_string($scope)) {
            return Arr.get(this.constructor.$globalScopes, this.constructor.class +
                '.' + $scope);
        }

        return Arr.get(
            this.constructor.$globalScopes, this.constructor.class +
            '.' + get_class($scope)
        );
    }

    /**
     * getGlobalScopes method.
     * @returns {any}
     */
    getGlobalScopes() {
        return Array.filter(this.constructor.$globalScopes, this.constructor, []);
    }
}
