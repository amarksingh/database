/**
 * Class MultipleRecordsFoundException.
 */
class MultipleRecordsFoundException extends Error {
    /**
     * Create a new instance.
     * @param {*} count
     */
    constructor(count = null) {
        let message = count 
            ? `${count} records were found.`
            : 'Multiple records were found.';
        super(message);
        this.name = this.constructor.name;
        this.code = 'ERR_MULTIPLE_RECORDS_FOUND';
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = MultipleRecordsFoundException;
