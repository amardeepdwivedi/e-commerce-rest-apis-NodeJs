import { DEBUG_MODE } from '../config';

import { ValidationError } from 'joi';

import CustomErrorHandler from '../services/CustomErrorHandler';

const errorHandler = (err, req, res, next) => {  // Default error handler
    let statusCode = 500;
    let data = {
        message: 'Internal server error',
       ...(DEBUG_MODE === 'true' && { originalError: err.message })
    }

    if (err instanceof ValidationError) {      // Validation error
        statusCode = 422;
        data = {
            message: err.message
          }     
    }

    if (err instanceof CustomErrorHandler) {   // Custom error handler
        statusCode = err.status;
        data = {
            message: err.message
        }
    }

    return res.status(statusCode).json(data);
}

export default errorHandler;