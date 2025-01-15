import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import db from "../config/db.js";
import jwt from 'jsonwebtoken';

export const registerUsers = async (req, res) => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    try {
        // Checking if the user already exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // Inserting the new user into the database
        await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user']);
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const loginUsers = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        console.log("Login successful");
        
        return res.status(200).json({ token });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}