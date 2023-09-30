const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const User = require('../models/user');

const { SALT_ROUND, JWT_SECRET = 'my-secret-key' } = require('../consts/consts');

const { ErrorNotFound } = require('../errors/errorNotFound');

const { ErrorBadRequest } = require('../errors/errorBadRequest');

const { ErrorValidation } = require('../errors/errorValidation');

const { ErrorConflict } = require('../errors/errorConflict');

module.exports.createUser = (req, res, next) => {
  const {
    name,
    email,
    password,
  } = req.body;

  if (!email || !password) {
    next(new ErrorBadRequest('Email и пароль обязательны для заполнения!'));
  }

  bcrypt.hash(password, SALT_ROUND)
    .then((hash) => {
      User.create({
        name,
        email,
        password: hash,
      }).then((user) => {
        res.status(201).send(
          {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        );
      })
        .catch((err) => {
          if (err.name === 'MongoServerError' || err.code === 11000) {
            next(new ErrorConflict('Пользователь с таким email уже существует!'));
          }
          if (err.name === 'ValidationError') {
            next(new ErrorValidation(err.message));
          }
          next(err);
        });
    });
};

module.exports.updateUser = (req, res, next) => {
  const { name, email } = req.body;

  if (req.user._id) {
    User.findByIdAndUpdate(req.user._id, { name, email }, { runValidators: true })
      .then((user) => res.status(200).send({ email: user.email, name: user.name }))
      .catch((err) => {
        if (err.name === 'ValidationError') {
          next(new ErrorValidation(err.message));
        } else {
          next(new ErrorNotFound('Пользователь по указанному _id не найден.'));
        }

        next(err);
      });
  }
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findUserByCredentials(email, password)
    .then((user) => {
      console.log(user);

      const token = jwt.sign(
        { _id: user._id },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      res
        .status(200)
        .send({ token });
    })
    .catch((err) => next(err));
};

module.exports.getUserMe = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id)
    .then((user) => {
      if (!user) {
        return next(new ErrorNotFound('Пользователь по указанному _id не найден.'));
      }

      return res.status(200).send({ email: user.email, name: user.name });
    })
    .catch((err) => next(err));
};
