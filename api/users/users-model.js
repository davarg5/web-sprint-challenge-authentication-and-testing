const db = require('./../../data/dbConfig');

module.exports = {
    getAll,
    getByUser,
    add
}

function getAll() {
    return db('users');
}

function getByUser(user) {
    return db('users').where(user).orderBy('id');
}

async function add(user) {
    const newId = await db('users').insert(user);
    return db('users').where('id', newId).first();
}