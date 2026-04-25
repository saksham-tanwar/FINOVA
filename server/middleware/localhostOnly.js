const localhostOnly = (req, res, next) => {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  const requestApiKey = req.headers["x-internal-api-key"];

  if (internalApiKey && requestApiKey && requestApiKey === internalApiKey) {
    return next();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const remoteAddress =
    forwardedFor ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;

  const allowed = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

  if (allowed.some((value) => String(remoteAddress).includes(value))) {
    return next();
  }

  return res.status(403).json({ message: "Localhost only" });
};

module.exports = localhostOnly;
