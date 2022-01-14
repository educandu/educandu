export function getEnvAsString(name, defaultValue = null) {
  const value = process.env[name];
  if (value) {
    return value;
  }

  if (defaultValue) {
    return defaultValue;
  }

  throw new Error(`Missing environment variable '${name}'`);
}
