"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.createError = void 0;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    if (error.message.includes('ECONNREFUSED')) {
        statusCode = 503;
        message = 'Database connection failed';
    }
    else if (error.message.includes('Invalid object name')) {
        statusCode = 500;
        message = 'Database schema error';
    }
    else if (error.message.includes('Violation of UNIQUE KEY constraint')) {
        statusCode = 409;
        message = 'Duplicate entry - record already exists';
    }
    else if (error.message.includes('Cannot insert the value NULL')) {
        statusCode = 400;
        message = 'Required field is missing';
    }
    console.error(`Error ${statusCode}: ${message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user?.userId || 'anonymous'
    });
    const response = {
        success: false,
        error: message
    };
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        response.error = 'Internal Server Error';
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const response = {
        success: false,
        error: `Route ${req.originalUrl} not found`
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map