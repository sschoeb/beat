"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '..', envFile) });
exports.config = {
    // Database
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'table_user',
        password: process.env.DB_PASSWORD || 'table_password',
        database: process.env.DB_NAME || 'table_match_db'
    },
    // Server
    server: {
        port: parseInt(process.env.PORT || '3001'),
        env: process.env.NODE_ENV || 'development'
    },
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
    },
    // Admin
    admin: {
        password: process.env.ADMIN_PASSWORD || 'admin123'
    }
};
//# sourceMappingURL=environment.js.map