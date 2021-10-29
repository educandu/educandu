/* eslint no-process-env: off */

process.env.ELMU_ENV = process.env.ELMU_ENV || 'test';
process.env.ELMU_SKIP_DB_MIGRATIONS = process.env.ELMU_SKIP_DB_MIGRATIONS || true.toString();
process.env.ELMU_SKIP_DB_CHECKS = process.env.ELMU_SKIP_DB_CHECKS || true.toString();
process.env.ELMU_LOG_LEVEL = process.env.ELMU_LOG_LEVEL || 'muted';
