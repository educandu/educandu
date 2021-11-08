import DocumentOrderStore from './document-order-store.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('document-order-store', () => {
  let sut;
  let container;
  let testOrderKey;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(DocumentOrderStore);
    testOrderKey = 'document-order';
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('getNextOrder', () => {

    describe('when there is no order entry', () => {
      let result;
      beforeEach(async () => {
        result = await sut.getNextOrder();
      });
      it('should create one', async () => {
        const count = await sut.collection.countDocuments({ _id: testOrderKey });
        expect(count).toBe(1);
      });
      it('should return 1', () => {
        expect(result).toBe(1);
      });
    });

    describe('when there is an existing order entry', () => {
      let result;
      beforeEach(async () => {
        await sut.collection.insertOne({ _id: testOrderKey, seq: 5 });
        result = await sut.getNextOrder();
      });
      it('should increase the sequential number by 1', () => {
        expect(result).toBe(6);
      });
    });

    describe('when it is called multiple times at the same time', () => {
      let result;
      beforeEach(async () => {
        await sut.collection.insertOne({ _id: testOrderKey, seq: 0 });
        result = await Promise.all([
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder(),
          sut.getNextOrder()
        ]);
      });
      it('should create a contiguous sequence of numbers', () => {
        expect(result.slice().sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

  });

});
