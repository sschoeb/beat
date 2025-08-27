"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queueController_1 = require("../controllers/queueController");
const router = express_1.default.Router();
router.get('/', queueController_1.getQueue);
router.post('/', queueController_1.addToQueue);
router.get('/next', queueController_1.getNextFromQueue);
router.delete('/:id', queueController_1.removeFromQueue);
exports.default = router;
//# sourceMappingURL=queue.js.map