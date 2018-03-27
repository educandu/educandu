const testHelper = require('../test-helper');
const OrderRepository = require('./order-repository');

describe('order-repository', () => {
  let db;
  let sut;

  beforeAll(async () => {
    db = await testHelper.createTestDatabase();
  });

  afterAll(async () => {
    await testHelper.dropDatabase(db);
  });

  beforeEach(async () => {
    await testHelper.dropCollectionSafely(db.orders);
    sut = new OrderRepository(db);
  });

  describe('_getNextOrder', () => {
    const testOrderName = 'test';

    describe('when there is no order entry', () => {
      let result;
      beforeEach(async () => {
        result = await sut._getNextOrder(testOrderName);
      });
      it('should create one', async () => {
        const count = await db.orders.count({ _id: testOrderName });
        expect(count).toBe(1);
      });
      it('should return 1', () => {
        expect(result).toBe(1);
      });
    });

    describe('when there is an existing order entry', () => {
      let result;
      beforeEach(async () => {
        await db.orders.insertOne({ _id: testOrderName, seq: 5 });
        result = await sut._getNextOrder(testOrderName);
      });
      it('should increase the sequential number by 1', () => {
        expect(result).toBe(6);
      });
    });

    describe('when it is called multiple times', () => {
      let result;
      beforeEach(async () => {
        result = await Promise.all([
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName),
          sut._getNextOrder(testOrderName)
        ]);
      });
      it('should create a contiguous sequence of numbers', () => {
        expect(result.slice().sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

  });

});
