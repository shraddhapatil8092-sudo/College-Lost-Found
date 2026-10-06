import ApiError from '../utils/ApiError.js';

export function validateRequest(schema, { source = 'body', target = 'validatedBody' } = {}) {
  return (request, _response, next) => {
    const { error, value } = schema.validate(request[source], {
      abortEarly: false,
      convert: true,
      stripUnknown: false,
    });

    if (error) {
      return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.details));
    }

    request[target] = value;
    return next();
  };
}