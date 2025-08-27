"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
// Simple authentication middleware
const authenticate = (req, res, next) => {
    const password = req.headers['x-admin-password'];
    if (password !== 'tfcz3000') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
};
router.get('/matches', authenticate, adminController_1.getAllMatches);
router.delete('/matches/:id', authenticate, adminController_1.deleteMatch);
exports.default = router;
//# sourceMappingURL=admin.js.map