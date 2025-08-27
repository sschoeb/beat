"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rankingsController_1 = require("../controllers/rankingsController");
const router = express_1.default.Router();
router.get('/', rankingsController_1.getRankings);
router.get('/elo', rankingsController_1.getEloRankings);
exports.default = router;
//# sourceMappingURL=rankings.js.map