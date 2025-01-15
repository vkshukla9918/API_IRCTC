import db from "../config/db.js";

export const bookTicket = async (req, res) => {
    const { trainId } = req.body;
    if (!trainId) {
        return res.status(400).json({ msg: "Train ID is required" });
    }
    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Selecting available seats and version with row lock
        const [[train]] = await connection.execute("SELECT available_seats, version FROM trains WHERE id = ? FOR UPDATE",[trainId]);

        if (train.available_seats <= 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ msg: "No seats available" });
        }
        const result = await connection.execute("UPDATE trains SET available_seats = available_seats - 1, version = version + 1 WHERE id = ? AND version = ?",[trainId, train.version]);

        if (result[0].affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ msg: "Booking conflict, please try again" });
        }
        // Insert booking
        await connection.execute("INSERT INTO bookings (user_id, train_id) VALUES (?, ?)",[req.user.id, trainId]);
        await connection.commit();
        connection.release();

        res.status(201).json({ msg: "Seat booked successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getBooking = async (req, res) => {
    const { bookingId } = req.params;
    try {
        const [booking] = await db.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [bookingId, req.user.id]);
    
        if (!booking.length) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        res.status(200).json(booking[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}