const Movie = require('../models/movie');

const { ErrorNotFound } = require('../errors/errorNotFound');

const { ErrorValidation } = require('../errors/errorValidation');

const { ErrorForbidden } = require('../errors/errorForbidden');

module.exports.getMovies = (req, res, next) => {
  Movie.find({})
    .then((movies) => {
      const moviesSaveByUser = movies
        .filter((movie) => movie.owner._id.toString() === req.user._id);
      res.status(200).send(moviesSaveByUser);
    })
    .catch((err) => next(err));
};

module.exports.createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
  } = req.body;

  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
    owner: req.user._id,
  })
    .then((movie) => res.status(201).send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ErrorValidation(err.message));
      } else {
        next(err);
      }
    });
};

module.exports.deleteMovie = (req, res, next) => {
  const { movieId } = req.params;

  Movie.findById(movieId)
    .orFail()
    .then((movie) => {
      if (req.user._id !== movie.owner._id.toString()) {
        next(new ErrorForbidden('Нельзя удалять фильм из чужого списка!'));
      } else {
        Movie.findByIdAndRemove(movieId)
          .orFail()
          .then(() => {
            res.status(200).send({ message: 'Фильм удален из списка!' });
          })
          .catch((err) => {
            if (err.name === 'DocumentNotFoundError') {
              next(new ErrorNotFound('Фильм с указанным id не найден.'));
            }

            next(err);
          });
      }
    })
    .catch((err) => {
      if (err.name === 'DocumentNotFoundError') {
        next(new ErrorNotFound('Фильм с указанным id не найден.'));
      }
      next(err);
    });
};
