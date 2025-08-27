"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const personController_1 = require("../controllers/personController");
const router = express_1.default.Router();
router.get('/', personController_1.getAllPersons);
router.post('/', personController_1.createPerson);
exports.default = router;
//# sourceMappingURL=persons.js.map