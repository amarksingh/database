const DateTime = require('@ostro/support/dateTime')
const { is_null } = require('@ostro/support/function')

/**
 * Class HasTimestamps.
 */
class HasTimestamps {

    $timestamps = true;

    /**
     * touch method.
     * @returns {any}
     */
    touch() {
        if (!this.usesTimestamps()) {
            return false;
        }

        this.updateTimestamps();

        return this.save();
    }

    /**
     * updateTimestamps method.
     * @returns {any}
     */
    updateTimestamps() {
        let $time = this.freshTimestampString();

        let $updatedAtColumn = this.getUpdatedAtColumn();

        if (!is_null($updatedAtColumn) && !this.isDirty($updatedAtColumn)) {
            this.setUpdatedAt($time);
        }

        let $createdAtColumn = this.getCreatedAtColumn();

        if (!this.$exists && !is_null($createdAtColumn) && !this.isDirty($createdAtColumn)) {
            this.setCreatedAt($time);
        }
    }

    /**
     * setCreatedAt method.
     * @param {*} $value
     * @returns {any}
     */
    setCreatedAt($value) {
        this.setAttribute(this.getCreatedAtColumn(), $value)
        return this;
    }

    /**
     * setUpdatedAt method.
     * @param {*} $value
     * @returns {any}
     */
    setUpdatedAt($value) {
        this.setAttribute(this.getUpdatedAtColumn(), $value)
        return this;
    }

    /**
     * freshTimestamp method.
     * @returns {any}
     */
    freshTimestamp() {
        return DateTime.now();
    }

    /**
     * freshTimestampString method.
     * @returns {any}
     */
    freshTimestampString() {
        return this.fromDateTime(this.freshTimestamp());
    }

    /**
     * fromDateTime method.
     * @param {*} time
     * @returns {any}
     */
    fromDateTime(time) {
        return time.format(this.$dateFormat);
    }

    /**
     * usesTimestamps method.
     * @returns {any}
     */
    usesTimestamps() {
        return this.$timestamps;
    }

    /**
     * getCreatedAtColumn method.
     * @returns {any}
     */
    getCreatedAtColumn() {
        return this.CREATED_AT;
    }

    /**
     * getUpdatedAtColumn method.
     * @returns {any}
     */
    getUpdatedAtColumn() {
        return this.UPDATED_AT;
    }

    /**
     * getQualifiedCreatedAtColumn method.
     * @returns {any}
     */
    getQualifiedCreatedAtColumn() {
        return this.qualifyColumn(this.getCreatedAtColumn());
    }

    /**
     * getQualifiedUpdatedAtColumn method.
     * @returns {any}
     */
    getQualifiedUpdatedAtColumn() {
        return this.qualifyColumn(this.getUpdatedAtColumn());
    }

    /**
     * isIgnoringTouch method.
     * @returns {any}
     */
    isIgnoringTouch() {
        return false;
    }
}

module.exports = HasTimestamps
