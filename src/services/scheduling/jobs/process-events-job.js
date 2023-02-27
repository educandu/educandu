import EventService from '../../event-service.js';

const IDLE_POLL_INTERVAL_IN_MS = 10000;

export default class ProcessEventsJob {
  static dependencies = [EventService];

  constructor(eventService) {
    this.name = 'process-events';
    this.eventService = eventService;
    this.idlePollIntervalInMs = IDLE_POLL_INTERVAL_IN_MS;
  }

  process(context) {
    return this.eventService.processNextEvent(context);
  }
}
