import express from "express";
import { authenticateUser } from "../middleware.js";
import { bookTicket, getBooking } from "../controllers/booking.js";

const router = express.Router();

router.post('/book', authenticateUser, bookTicket);
router.get('/:bookingId', authenticateUser, getBooking);

export default router;