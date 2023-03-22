import 'croner';
import toadScheduler from 'toad-scheduler';

const { ToadScheduler, AsyncTask, SimpleIntervalJob, CronJob } = toadScheduler;

export default class ToadSchedulerWrapper {
  constructor() {
    this._scheduler = new ToadScheduler();
  }

  addIntervalJob({ name, schedule, preventOverrun, onProcess, onError }) {
    const task = new AsyncTask(name, onProcess, onError);
    const job = new SimpleIntervalJob(schedule, task);
    this._scheduler.addSimpleIntervalJob(job, { preventOverrun });
  }

  addCronJob({ name, cronExpression, preventOverrun, onProcess, onError }) {
    const task = new AsyncTask(name, onProcess, onError);
    const job = new CronJob({ cronExpression }, task, { preventOverrun });
    this._scheduler.addCronJob(job);
  }
}
