import sinon from 'sinon';
import sut from './documents-utils.js';

describe('documents-utils', () => {
  let result;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('determineUpcomingDueDocument', () => {
    let documents;

    describe('when no document is due', () => {
      beforeEach(() => {
        const now = new Date();

        documents = [
          { title: 'L1' },
          { title: 'L2' },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingDueDocument(now, documents);
      });
      it('should return undefined', () => {
        expect(result).toBeUndefined();
      });
    });

    describe('when the first document is due', () => {
      beforeEach(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 1000);

        documents = [
          { title: 'L1', dueOn: future.toISOString() },
          { title: 'L2' },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingDueDocument(now, documents);
      });
      it('should return the first document', () => {
        expect(result).toBe(documents[0]);
      });
    });

    describe('when the second document is due', () => {
      beforeEach(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 1000);

        documents = [
          { title: 'L1' },
          { title: 'L2', dueOn: future.toISOString() },
          { title: 'L3' }
        ];
        result = sut.determineUpcomingDueDocument(now, documents);
      });
      it('should return the second document', () => {
        expect(result).toBe(documents[1]);
      });
    });

    describe('when all documents are due and there is one document due now', () => {
      beforeEach(() => {
        const now = new Date();
        const future1 = new Date(now.getTime() + 1000);
        const future2 = new Date(now.getTime() + 2000);

        documents = [
          { title: 'L1', dueOn: now.toISOString() },
          { title: 'L2', dueOn: future1.toISOString() },
          { title: 'L3', dueOn: future2.toISOString() }
        ];
        result = sut.determineUpcomingDueDocument(now, documents);
      });
      it('should return the current document', () => {
        expect(result).toBe(documents[0]);
      });
    });

    describe('when all documents are due and there are 2 future documents', () => {
      beforeEach(() => {
        const now = new Date();
        const past = new Date(now.getTime() - 1000);
        const future1 = new Date(now.getTime() + 1000);
        const future2 = new Date(now.getTime() + 2000);

        documents = [
          { title: 'L1', dueOn: past.toISOString() },
          { title: 'L2', dueOn: future1.toISOString() },
          { title: 'L3', dueOn: future2.toISOString() }
        ];
        result = sut.determineUpcomingDueDocument(now, documents);
      });
      it('should return the upcoming document', () => {
        expect(result).toBe(documents[1]);
      });
    });
  });
});
