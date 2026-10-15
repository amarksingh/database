const Grammar = require('./grammar');

/**
 * Class SqlServerGrammar.
 */
class SqlServerGrammar extends Grammar {
    /**
     * compileDropAllForeignKeys method.
     * @returns {any}
     */
    compileDropAllForeignKeys() {
        return `DECLARE @sql NVARCHAR(MAX) = N'';
            SELECT @sql += 'ALTER TABLE '
                + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + + QUOTENAME(OBJECT_NAME(parent_object_id))
                + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
            FROM sys.foreign_keys;
            EXEC sp_executesql @sql;
        `;
    }

    /**
     * compileDropAllTables method.
     * @returns {any}
     */
    compileDropAllTables() {
        return `DECLARE @sql NVARCHAR(MAX) = N'';

            SELECT @sql += N'DROP TABLE ' + QUOTENAME(schema_name(schema_id)) + '.' + QUOTENAME(name) + ';'
            FROM sys.tables;
            EXEC sp_executesql @sql;
        
        `;
    }
}

module.exports = SqlServerGrammar;