"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const connection_1 = require("./connection");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function initializeDatabase() {
    try {
        // When using Docker, the database and tables are already initialized
        // This function now just ensures we have the required sample data
        // Check if we need to add sample data
        const [existingPersons] = await connection_1.pool.execute('SELECT COUNT(*) as count FROM persons');
        const personCount = existingPersons[0].count;
        if (personCount === 0) {
            console.log('Adding sample data...');
            const schemaPath = path_1.default.join(__dirname, 'schema.sql');
            if (fs_1.default.existsSync(schemaPath)) {
                const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
                const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
                for (const statement of statements) {
                    if (statement.trim()) {
                        await connection_1.pool.execute(statement);
                    }
                }
            }
        }
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization failed:', error);
        // If tables don't exist, create them (fallback for non-Docker setups)
        try {
            console.log('Attempting to create tables...');
            const schemaPath = path_1.default.join(__dirname, 'schema.sql');
            if (fs_1.default.existsSync(schemaPath)) {
                const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
                const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
                for (const statement of statements) {
                    if (statement.trim()) {
                        await connection_1.pool.execute(statement);
                    }
                }
                console.log('Database tables created successfully');
            }
        }
        catch (fallbackError) {
            console.error('Fallback database initialization also failed:', fallbackError);
            throw fallbackError;
        }
    }
}
//# sourceMappingURL=init.js.map