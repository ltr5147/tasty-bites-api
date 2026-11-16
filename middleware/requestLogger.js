function requestLogger(req, res, next) {
  // Log on completion so JSON bodies and the final status are available.
  const timestamp = new Date().toISOString();
  res.on('finish', () => {
    const entry = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
    };
    if (req.method === 'POST' || req.method === 'PUT') {
      entry.body = req.body ?? null;
    }
    console.log(JSON.stringify(entry));
  });
  next();
}

module.exports = requestLogger;
