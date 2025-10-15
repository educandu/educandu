import joi from 'joi';
import { DASHBOARD_TAB_KEY } from '../constants.js';

export const getDashboardPageQuerySchema = joi.object({
  tab: joi.string().valid(...Object.values(DASHBOARD_TAB_KEY)).optional(),
});
