class MultipleRecordsFoundException extends Error {
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
