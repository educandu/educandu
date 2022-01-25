import sinon from 'sinon';
import sut from './lessons-utils.js';

describe('lesson-utils', () => {
  let result;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('determineUpcomingLesson', () => {
    let lessons;

    describe('when no lesson is scheduled', () => {
      beforeEach(() => {
        const now = new Date();

        lessons = [
          { title: 'L1' },
          { title: 'L2' },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingLesson(now, lessons);
      });
      it('should return undefined', () => {
        expect(result).toBeUndefined();
      });
    });

    describe('when the first lesson is scheduled', () => {
      beforeEach(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 1000);

        lessons = [
          { title: 'L1', schedule: { startsOn: future.toISOString() } },
          { title: 'L2' },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingLesson(now, lessons);
      });
      it('should return the first lesson', () => {
        expect(result).toBe(lessons[0]);
      });
    });

    describe('when the second lesson is scheduled', () => {
      beforeEach(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 1000);

        lessons = [
          { title: 'L1' },
          { title: 'L2', schedule: { startsOn: future.toISOString() } },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingLesson(now, lessons);
      });
      it('should return the second lesson', () => {
        expect(result).toBe(lessons[1]);
      });
    });

    describe('when all lessons are scheduled and there is one lesson starting now', () => {
      beforeEach(() => {
        const now = new Date();
        const future1 = new Date(now.getTime() + 1000);
        const future2 = new Date(now.getTime() + 2000);

        lessons = [
          { title: 'L1', schedule: { startsOn: now.toISOString() } },
          { title: 'L2', schedule: { startsOn: future1.toISOString() } },
          { title: 'L3', schedule: { startsOn: future2.toISOString() } }
        ];
        result = sut.determineUpcomingLesson(now, lessons);
      });
      it('should return the current lesson', () => {
        expect(result).toBe(lessons[0]);
      });
    });

    describe('when all lessons are scheduled and there are 2 future lessons', () => {
      beforeEach(() => {
        const now = new Date();
        const past = new Date(now.getTime() - 1000);
        const future1 = new Date(now.getTime() + 1000);
        const future2 = new Date(now.getTime() + 2000);

        lessons = [
          { title: 'L1', schedule: { startsOn: past.toISOString() } },
          { title: 'L2', schedule: { startsOn: future1.toISOString() } },
          { title: 'L3', schedule: { startsOn: future2.toISOString() } }
        ];
        result = sut.determineUpcomingLesson(now, lessons);
      });
      it('should return the upcoming lesson', () => {
        expect(result).toBe(lessons[1]);
      });
    });
  });
});
