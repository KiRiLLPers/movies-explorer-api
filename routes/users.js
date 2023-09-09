const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getUserMe,
  updateUser,
} = require('../controllers/users');

router.get(
  '/me',
  getUserMe,
);

router.patch(
  '/me',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(30),
      email: Joi.string().email(),
    }),
  }),
  updateUser,
);

module.exports = router;
