export const success = (res, { status = 200, message = "", data } = {}) => {
  const body = { success: true, message };
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(status).json(body);
};

export const failure = (res, { status = 400, message = "", errors } = {}) => {
  const body = { success: false, message };
  if (errors !== undefined) {
    body.errors = errors;
  }
  return res.status(status).json(body);
};

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
