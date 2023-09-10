require('dotenv').config();

const express = require('express');

const helmet = require('helmet');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const { errors } = require('celebrate');

const cors = require('cors');

const rateLimit = require('./middlewares/rateLimiter');

const handleError = require('./errors/handleError');

const routes = require('./routes/index');

const { requestLogger, errorLogger } = require('./middlewares/logger');

const { PORT = 3001, MONGODB_URL = 'mongodb://127.0.0.1/bitfilmsdb' } = process.env;
const app = express();

app.use(cors());

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
    });
  } catch (err) {
    console.log(err.message);
  }
};

connect().then(() => {
  console.log('connected');
});

app.use(requestLogger);

app.use('/', rateLimit);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

routes(app);

app.use(errorLogger);

app.use(errors());

app.use(handleError);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
