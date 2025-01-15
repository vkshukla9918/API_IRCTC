import db from "../config/db.js";
// import { redisClient } from "../config/redis.js";

export const addTrain = async (req, res) => {
    const { source, destination, totalSeats } = req.body;

    // Check for missing fields
    if (!source || !destination || !totalSeats) {
        return res.status(400).json({ msg: 'All fields are required' });
    }
    // Check if totalSeats is a valid number and greater than zero
    if (isNaN(totalSeats) || totalSeats <= 0) {
        return res.status(400).json({ msg: 'Total seats must be a valid number greater than zero' });
    }
    try {
        // Check for existing train on the same route before adding
        const [existingTrain] = await db.execute('SELECT * FROM trains WHERE source = ? AND destination = ?', [source, destination]);
        if (existingTrain.length > 0) {
            return res.status(409).json({ msg: 'A train already exists on this route' });  // Conflict response
        }
        // Insert the new train into the database
        await db.execute('INSERT INTO trains (source, destination, total_seats, available_seats) VALUES (?, ?, ?, ?)', [source, destination, totalSeats, totalSeats]);
        res.status(201).json({ msg: 'Train added successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const checkAvailability = async (req, res) => {
    const { source, destination } = req.body;
    if (!source || !destination) {
        return res.status(400).json({ msg: 'Source and destination are required' });
    }
    try {
        // Checking Redis cache first
        // const cachedData = await redisClient.get(`availability:${source}:${destination}`);
        // if (cachedData) {
        //     return res.json(JSON.parse(cachedData));
        // }
        // Fetching from DB if not in cache
        const [trains] = await db.execute('SELECT * FROM trains WHERE source = ? AND destination = ?', [source, destination]);

        // Checking if trains are found
        if (trains.length === 0) {
            return res.status(404).json({ msg: 'No trains available for the specified route' });
        }
        // Caching the result for 1 hour
        // await redisClient.set(`availability:${source}:${destination}`, 3600, JSON.stringify(trains));

        res.status(200).json(trains);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export const modifyTrain = async (req, res) => {
    const { source, destination, newTotalSeats } = req.body;

    // Check for missing fields
    if (!source || !destination || !newTotalSeats) {
        return res.status(400).json({ msg: 'All fields are required' });
    }

    // Check if newTotalSeats is a valid number and greater than zero
    if (isNaN(newTotalSeats) || newTotalSeats <= 0) {
        return res.status(400).json({ msg: 'Total seats must be a valid number greater than zero' });
    }

    try {
        // Check if the train exists on the given route
        const [existingTrain] = await db.execute('SELECT * FROM trains WHERE source = ? AND destination = ?', [source, destination]);

        if (existingTrain.length === 0) {
            return res.status(404).json({ msg: 'Train not found on this route' });
        }

        // Get current available and total seats
        const currentAvailableSeats = existingTrain[0].available_seats;
        const currentTotalSeats = existingTrain[0].total_seats;

        // Calculate the seat difference
        const seatDifference = newTotalSeats - currentTotalSeats;
        const newAvailableSeats = currentAvailableSeats + seatDifference;

        // Ensure available seats don't go below zero
        if (newAvailableSeats < 0) {
            return res.status(400).json({ msg: 'Cannot reduce seats below the number of booked seats' });
        }

        // Update the train's total and available seats
        await db.execute(
            'UPDATE trains SET total_seats = ?, available_seats = ? WHERE source = ? AND destination = ?',
            [newTotalSeats, newAvailableSeats, source, destination]
        );

        res.status(200).json({ msg: 'Train seats updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}