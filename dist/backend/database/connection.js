"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const environment_1 = require("../config/environment");
const dbConfig = {
    host: environment_1.config.database.host,
    port: environment_1.config.database.port,
    user: environment_1.config.database.user,
    password: environment_1.config.database.password,
    database: environment_1.config.database.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
exports.pool = promise_1.default.createPool(dbConfig);
async function testConnection() {
    try {
        const connection = await exports.pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    }
    catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}
//# sourceMappingURL=connection.js.map