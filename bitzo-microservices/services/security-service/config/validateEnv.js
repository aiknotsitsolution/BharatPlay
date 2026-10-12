const JWT_SECRET_MIN_LENGTH = 32;

const REQUIRED_VARS = ["MONGO_URI","JWT_SECRET"];

const validateEnv = () => {
  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  } else if (process.env.JWT_SECRET.length < JWT_SECRET_MIN_LENGTH) {
    console.error(
      `[validateEnv] JWT_SECRET is too weak: ${process.env.JWT_SECRET.length} characters (min ${JWT_SECRET_MIN_LENGTH}).`
    );
    process.exit(1);
  }

  REQUIRED_VARS.forEach((name) => {
    if (!process.env[name]) missing.push(name);
  });

  if (missing.length > 0) {
    console.error(`[validateEnv] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
};

module.exports = validateEnv;
