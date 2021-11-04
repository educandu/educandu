/* eslint no-process-env: off */

process.env.EDUCANDU_ENV = process.env.EDUCANDU_ENV || 'test';
process.env.EDUCANDU_SKIP_DB_MIGRATIONS = process.env.EDUCANDU_SKIP_DB_MIGRATIONS || true.toString();
process.env.EDUCANDU_SKIP_DB_CHECKS = process.env.EDUCANDU_SKIP_DB_CHECKS || true.toString();
process.env.ELMU_LOG_LEVEL = process.env.ELMU_LOG_LEVEL || 'muted';
