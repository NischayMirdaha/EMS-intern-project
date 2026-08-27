export const errorHandler = (err, req, res, _next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);


  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "This record already exists.",
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced record does not exist.",
    });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong on our end." : err.message,
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};
