if (!process.env.EDUCANDU_SKIP_MONGO_MIGRATIONS) {
  process.env.EDUCANDU_SKIP_MONGO_MIGRATIONS = true.toString();
}
if (!process.env.EDUCANDU_SKIP_MONGO_CHECKS) {
  process.env.EDUCANDU_SKIP_MONGO_CHECKS = true.toString();
}
if (!process.env.EDUCANDU_LOG_LEVEL) {
  process.env.EDUCANDU_LOG_LEVEL = 'error';
}
