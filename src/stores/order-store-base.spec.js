const testHelper = require('../test-helper');
const OrderStoreBase = require('./order-store-base');

describe('order-store-base', () => {
  let db;
  let sut;
  let collection;
  let testOrderKey;
  let testOrderCollectionName;

  beforeAll(async () => {
    db = await testHelper.createTestDatabase();
  });

  afterAll(async () => {
    await testHelper.dropDatabase(db);
    await db.dispose();
  });

  beforeEach(() => {
    testOrderKey = 'test-order-name';
    testOrderCollectionName = 'test-orders';
    collection = testHelper.getTestCollection(db, testOrderCollectionName);
    sut = new OrderStoreBase(collection, testOrderKey);
  });

  afterEach(async () => {
    await testHelper.dropAllCollections(db);
  });

  describe('getNextOrder', () => {

    describe('when there is no order entry', () => {
      let result;
      beforeEach(async () => {
        result = await sut.getNextOrder();
      });
      it('should create one', async () => {
        const count = await collection.count({ _id: testOrderKey });
        expect(count).toBe(1);
      });
      it('should return 1', () => {
        expect(result).toBe(1);
      });
    });

    describe('when there is an existing order entry', () => {
      let result;
      beforeEach(async () => {
        await collection.insertOne({ _id: testOrderKey, seq: 5 });
        result = await sut.getNextOrder();
      });
      it('should increase the sequential number by 1', () => {
        expect(result).toBe(6);
      });
    });

    describe('when it is called multiple times', () => {
      let result;
      beforeEach(async () => {
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
