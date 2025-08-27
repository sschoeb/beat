"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPersons = getAllPersons;
exports.createPerson = createPerson;
const connection_1 = require("../database/connection");
async function getAllPersons(_req, res) {
    try {
        const [rows] = await connection_1.pool.execute('SELECT id, name, created_at as createdAt FROM persons ORDER BY name');
        const persons = rows.map(row => ({
            id: row.id,
            name: row.name,
            createdAt: new Date(row.createdAt)
        }));
        res.json(persons);
    }
    catch (error) {
        console.error('Error fetching persons:', error);
        res.status(500).json({ error: 'Failed to fetch persons' });
    }
}
async function createPerson(req, res) {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Name is required and must be a string' });
            return;
        }
        const [result] = await connection_1.pool.execute('INSERT INTO persons (name) VALUES (?)', [name]);
        const [rows] = await connection_1.pool.execute('SELECT id, name, created_at as createdAt FROM persons WHERE id = ?', [result.insertId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Person not found after creation' });
            return;
        }
        const person = {
            id: rows[0].id,
            name: rows[0].name,
            createdAt: new Date(rows[0].createdAt)
        };
        res.status(201).json(person);
    }
    catch (error) {
        console.error('Error creating person:', error);
        res.status(500).json({ error: 'Failed to create person' });
    }
}
//# sourceMappingURL=personController.js.map