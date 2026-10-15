/**
 * Class Processor.
 */
class Processor {

    /**
     * processSelect method.
     * @param {*} $query
     * @param {*} $results
     * @returns {any}
     */
    processSelect($query, $results) {
        return $results;
    }

    /**
     * processInsertGetId method.
     * @param {*} $query
     * @param {*} $sql
     * @param {*} $values
     * @param {*} $sequence
     * @returns {any}
     */
    processInsertGetId($query, $sql, $values, $sequence = null) {
        return $sequence
    }

    /**
     * processTables method.
     * @param {*} $results
     * @returns {any}
     */
    processTables($results) {
        return $results;
    }

    /**
     * processViews method.
     * @param {*} $results
     * @returns {any}
     */
    processViews($results) {
        return $results;
    }

    /**
     * processTypes method.
     * @param {*} $results
     * @returns {any}
     */
    processTypes($results) {
        return $results;
    }

    /**
     * processColumns method.
     * @param {*} $results
     * @returns {any}
     */
    processColumns($results) {
        return $results;
    }

    /**
     * processIndexes method.
     * @param {*} $results
     * @returns {any}
     */
    processIndexes($results) {
        return $results;
    }

    /**
     * processForeignKeys method.
     * @param {*} $results
     * @returns {any}
     */
    processForeignKeys($results) {
        return $results;
    }

    /**
     * processColumnListing method.
     * @param {*} $results
     * @returns {any}
     */
    processColumnListing($results) {
        return $results;
    }

}

module.exports = Processor;