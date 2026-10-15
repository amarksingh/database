const { is_null } = require('@ostro/support/function');
const Connection = require('./connection');
const SchemaGrammar = require('../schema/grammars/oracleGrammar');
const QueryGrammar = require('../query/grammars/oracleGrammar');
const QueryProcessor = require('../query/processors/mysqlProcessor');
const SchemaBuilder = require('../schema/oracleBuilder');

/**
 * Class OracleConnection.
 */
class OracleConnection extends Connection {
    /**
     * getDefaultSchemaGrammar method.
     * @returns {any}
     */
    getDefaultSchemaGrammar() {
        const $grammar = new SchemaGrammar
        $grammar.setConnection(this);

        return this.withTablePrefix($grammar)
    }

    /**
     * getDefaultQueryGrammar method.
     * @returns {any}
     */
    getDefaultQueryGrammar() {
        const $grammar = new QueryGrammar()
        $grammar.setConnection(this);

        return this.withTablePrefix($grammar);
    }

    /**
     * getSchemaBuilder method.
     * @returns {any}
     */
    getSchemaBuilder() {
        if (is_null(this.$schemaGrammar)) {
            this.useDefaultSchemaGrammar();
        }

        return new SchemaBuilder(this);
    }

    /**
     * getDefaultPostProcessor method.
     * @returns {any}
     */
    getDefaultPostProcessor() {
        return new QueryProcessor;
    }

    /**
     * __call method.
     * @param {*} target
     * @param {*} method
     * @param {*} parameters
     * @returns {any}
     */
    __call(target, method, parameters) {
        return target.$connection[method](...parameters)
    }

}

module.exports = OracleConnection
