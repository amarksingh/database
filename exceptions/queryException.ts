const queryExceptionContract = require('@ostro/contracts/exception/queryException')
/**
 * Class queryException.
 */
class queryException extends queryExceptionContract {
    /**
     * Create a new instance.
     * @param {*} message
     */
    constructor(message) {
        super();
        this.name = this.constructor.name;
        this.code = 'SQL_ERROR';
        this.message = message || 'Invalid query';
        this.statusCode = 500
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = queryException