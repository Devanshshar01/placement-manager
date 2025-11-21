const AppError = require('../utils/AppError');

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    // Programming or other unknown error: don't leak details
    else {
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (error.name === 'CastError') error = new AppError(`Invalid ${error.path}: ${error.value}`, 400);
        if (error.code === 11000) error = new AppError('Duplicate field value entered', 400);
        if (error.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again!', 401);
        if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired! Please log in again.', 401);

        sendErrorProd(error, res);
    }
};
