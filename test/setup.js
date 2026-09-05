const DatabaseManager = require('../databaseManager');
const ConnectionFactory = require('../connectors/connectionFactory');
const Model = require('../eloquent/model');

function createTestContainer() {
    const bindings = {};
    const singletons = {};

    const container = {
        config: {
            database: {
                default: 'sqlite',
                connections: {
                    sqlite: {
                        driver: 'sqlite',
                        database: ':memory:',
                        prefix: '',
                    },
                    sqlite_secondary: {
                        driver: 'sqlite',
                        database: ':memory:',
                        prefix: 'test_',
                    }
                }
            }
        },
        bound(key) {
            return Boolean(bindings[key] || singletons[key]);
        },
        bind(key, resolver) {
            bindings[key] = resolver;
        },
        singleton(key, resolver) {
            singletons[key] = resolver;
        },
        make(key, params = []) {
            if (singletons[key]) {
                if (typeof singletons[key] === 'function') {
                    singletons[key] = singletons[key](container, ...params);
                }
                return singletons[key];
            }
            if (bindings[key]) {
                return typeof bindings[key] === 'function' ? bindings[key](container, ...params) : bindings[key];
            }
            if (typeof key === 'function') {
                return new key(...params);
            }
            return null;
        },
        instance(key, val) {
            singletons[key] = val;
            return val;
        }
    };

    return container;
}

function createDatabaseManager(container = createTestContainer()) {
    const factory = new ConnectionFactory(container);
    const db = new DatabaseManager(container, factory);
    Model.setConnectionResolver(db);
    return { db, container, factory };
}

async function closeConnections(db) {
    if (db && typeof db.getConnections === 'function') {
        const connections = db.getConnections();
        for (const key of Object.keys(connections)) {
            const conn = connections[key];
            if (conn && typeof conn.disconnect === 'function') {
                await conn.disconnect();
            }
        }
    }
}

module.exports = {
    createTestContainer,
    createDatabaseManager,
    closeConnections
};
