"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const matchController_1 = require("../controllers/matchController");
const router = express_1.default.Router();
router.get('/current', matchController_1.getCurrentMatch);
router.post('/start', matchController_1.startMatch);
router.post('/start-from-queue', matchController_1.startMatchFromQueue);
router.post('/end', matchController_1.endMatch);
router.post('/cancel', matchController_1.cancelMatch);
router.post('/forfeit', matchController_1.forfeitMatch);
exports.default = router;
//# sourceMappingURL=matches.js.map