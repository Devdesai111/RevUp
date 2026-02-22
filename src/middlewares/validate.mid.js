'use strict';

const { Errors } = require('../utils/AppError');

/**
 * Zod validation middleware factory.
 * Schema must wrap body/query/params:
 *   z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
 *
 * Usage:
 *   router.post('/route', validate(mySchema), controller)
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body:   req.body,
    query:  req.query,
    params: req.params,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    return next(Errors.validationError('Validation failed', errors));
  }

  // Assign validated + coerced values back to request
  if (result.data.body)   { req.body   = result.data.body; }
  if (result.data.query)  { req.query  = result.data.query; }
  if (result.data.params) { req.params = result.data.params; }

  return next();
};

module.exports = validate;
