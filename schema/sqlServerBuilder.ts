const Builder = require('./builder');

/**
 * Class SqlServerBuilder.
 */
class SqlServerBuilder extends Builder {
	/**
	 * dropAllTables method.
	 * @async
	 * @returns {any}
	 */
	async dropAllTables() {
		await this.statement(this.$grammar.compileDropAllForeignKeys())
		await this.statement(this.$grammar.compileDropAllTables())

	}
}

module.exports = SqlServerBuilder
