import EventService from '../../event-service.js';

const IDLE_POLL_INTERVAL_IN_MS = 10000;
const BUSY_POLL_INTERVAL_IN_MS = 0;

export default class ProcessEventsJob {
  static dependencies = [EventService];

  constructor(eventService) {
    this.name = 'process-events';
    this.eventService = eventService;
    this.idlePollIntervalInMs = Number(process.env.IDLE_POLL_INTERVAL_IN_MS) || IDLE_POLL_INTERVAL_IN_MS;
    this.busyPollIntervalInMs = Number(process.env.BUSY_POLL_INTERVAL_IN_MS) || BUSY_POLL_INTERVAL_IN_MS;
  }

  process(context) {
    return this.eventService.processNextEvent(context);
  }
}
