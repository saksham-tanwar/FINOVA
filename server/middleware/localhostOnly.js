const localhostOnly = (req, res, next) => {
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
