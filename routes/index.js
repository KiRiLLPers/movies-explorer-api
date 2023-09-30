const auth = require('../middlewares/auth');

const userRouter = require('./users');

const moviesRouter = require('./movies');

const signRouter = require('./sign');

module.exports = (app) => {
  app.use('/', signRouter);
  app.use(auth);
  app.use('/users', userRouter);
  app.use('/movies', moviesRouter);
  app.use('*', (req, res) => {
    res.status(404).send({ message: 'Страница не найдена' });
  });
};
