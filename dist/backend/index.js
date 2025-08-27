"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const environment_1 = require("./config/environment");
const connection_1 = require("./database/connection");
const init_1 = require("./database/init");
const persons_1 = __importDefault(require("./routes/persons"));
const matches_1 = __importDefault(require("./routes/matches"));
const queue_1 = __importDefault(require("./routes/queue"));
const rankings_1 = __importDefault(require("./routes/rankings"));
const admin_1 = __importDefault(require("./routes/admin"));
const playerStats_1 = __importDefault(require("./routes/playerStats"));
const app = (0, express_1.default)();
const PORT = environment_1.config.server.port;
// Configure CORS for production
app.use((0, cors_1.default)({
    origin: environment_1.config.cors.origin,
    credentials: true
}));
app.use(express_1.default.json());
app.use('/api/persons', persons_1.default);
app.use('/api/matches', matches_1.default);
app.use('/api/queue', queue_1.default);
app.use('/api/rankings', rankings_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/player-stats', playerStats_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
async function startServer() {
    try {
        await (0, connection_1.testConnection)();
        await (0, init_1.initializeDatabase)();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map