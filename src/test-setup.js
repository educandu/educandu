/* eslint no-process-env: off */

require('@babel/register')({ extensions: ['.jsx'] });
require('core-js');

process.env.ELMU_ENV = process.env.ELMU_ENV || 'test';
process.env.ELMU_LOG_LEVEL = process.env.ELMU_LOG_LEVEL || 'muted';
