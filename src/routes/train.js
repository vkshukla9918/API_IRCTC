import express from "express";
import { authenticateAdmin, authenticateUser } from "../middleware.js";
import { addTrain, checkAvailability, modifyTrain } from "../controllers/train.js";

const router = express.Router();

router.post('/add-train', authenticateAdmin, addTrain);
router.put("/modify-train", authenticateAdmin, modifyTrain);
router.get('/availability', authenticateUser, checkAvailability);

export default router;