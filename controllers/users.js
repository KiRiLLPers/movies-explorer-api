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
  const findAndModify = () => User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { runValidators: true },
  );

  User.find({ email })
    .then(([user]) => {
      if (user && user._id.toString() !== req.user._id) {
        throw new ErrorConflict('Пользователь с таким Email уже существует!');
      }
      return findAndModify();
    })
    .then(() => {
      res.send({
        name,
        email,
      });
    })
    .catch(next);
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

      return res.status(200).send({ email: user.email, name: user.name, _id: user._id });
    })
    .catch((err) => next(err));
};
