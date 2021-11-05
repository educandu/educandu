/* eslint no-process-env: off */

process.env.EDUCANDU_ENV = process.env.EDUCANDU_ENV || 'test';
process.env.EDUCANDU_SKIP_MONGO_MIGRATIONS = process.env.EDUCANDU_SKIP_MONGO_MIGRATIONS || true.toString();
process.env.EDUCANDU_SKIP_MONGO_CHECKS = process.env.EDUCANDU_SKIP_MONGO_CHECKS || true.toString();
process.env.EDUCANDU_LOG_LEVEL = process.env.EDUCANDU_LOG_LEVEL || 'muted';
