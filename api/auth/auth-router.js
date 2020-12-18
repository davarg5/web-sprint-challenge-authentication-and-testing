const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./../../config/secret');

const Users = require('./../users/users-model');

const checkPayload = (req, res, next) => {
  if(!req.body.username || !req.body.password) {
    res.status(400).json({ message: 'You must include a username and password' })
  }
  else {
    next();
  }
}

const usernameUnique = async (req, res, next) => {
  try {
    const rows = await Users.getByUser({ username: req.body.username })
    if(!rows.length) {
      next()
    } else {
      res.status(400).json({ message: 'username already taken' })
    }
  } catch(e) {
    res.status(500).json({ message: e.message })
  }
}

const usernameExists = async (req, res, next) => {
  try {
    const rows = await Users.getByUser({ username: req.body.username })
    if(rows.length) {
      next()
    } else {
      res.status(400).json({ message: 'invalid credentials' })
    }
  } catch(e) {
    res.status(500).json({ message: e.message })
  }
}

router.post('/register', checkPayload, usernameUnique, (req, res) => {
      const credentials = req.body;

      const rounds = process.env.BCRYPT_ROUNDS || 8;
      const hash = bcrypt.hashSync(credentials.password, rounds);
      credentials.password = hash;

      Users.add(credentials)
        .then(user => {
          res.status(201).json(user);
        })
        .catch(err => {
          res.status(500).json({ message: err.message });
        })
});

router.post('/login', checkPayload, usernameExists, (req, res) => {
  const { username, password } = req.body;

  Users.getByUser({ username: username })
    .then(([user]) => {
      if(user && bcrypt.compareSync(password, user.password)) {
        const token = makeToken(user);
        res.status(200).json({
          message: `Welcome, ${user.username}!`,
          token,
        })
      } else {
        res.status(401).json({ message: 'invalid credentials' })
      }
    })
    .catch(err => {
      res.status(500).json({ message: err.message })
    })
});

const makeToken = user => {
  const payload = { 
    subject: user.id,
    username: user.username,
  };
  const options = {
    expiresIn: '120s'
  };
  return jwt.sign(payload, jwtSecret, options);
} 

module.exports = router;
