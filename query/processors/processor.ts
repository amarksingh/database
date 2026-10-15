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
    processSelect($query: any, $results: any) {
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
    processInsertGetId($query: any, $sql: any, $values: Record<string, any>, $sequence: any = null) {
        return $sequence
    }

    /**
     * processTables method.
     * @param {*} $results
     * @returns {any}
     */
    processTables($results: any) {
        return $results;
    }

    /**
     * processViews method.
     * @param {*} $results
     * @returns {any}
     */
    processViews($results: any) {
        return $results;
    }

    /**
     * processTypes method.
     * @param {*} $results
     * @returns {any}
     */
    processTypes($results: any) {
        return $results;
    }

    /**
     * processColumns method.
     * @param {*} $results
     * @returns {any}
     */
    processColumns($results: any) {
        return $results;
    }

    /**
     * processIndexes method.
     * @param {*} $results
     * @returns {any}
     */
    processIndexes($results: any) {
        return $results;
    }

    /**
     * processForeignKeys method.
     * @param {*} $results
     * @returns {any}
     */
    processForeignKeys($results: any) {
        return $results;
    }

    /**
     * processColumnListing method.
     * @param {*} $results
     * @returns {any}
     */
    processColumnListing($results: any) {
        return $results;
    }

}

module.exports = Processor;