import ClientDataMapper from './client-data-mapper.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('client-data-mapper', () => {
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(ClientDataMapper);
  });

  beforeEach(async () => {
    user = await setupTestUser(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('mapImportBatches', () => {
    it('should map the user data', async () => {
      const user2 = await setupTestUser(container, { username: 'test2', email: 'test2@x.com' });
      const batches = await sut.mapImportBatches([{ createdBy: user._id }, { createdBy: user2._id }], user);
      expect(batches[0].createdBy).toEqual({
        _id: user._id,
        key: user._id,
        username: user.username
      });

      expect(batches[1].createdBy).toEqual({
        _id: user2._id,
        key: user2._id,
        username: user2.username
      });
    });
  });

  describe('mapImportBatch', () => {
    it('should map the user data', async () => {
      const batch = await sut.mapImportBatch({ createdBy: user._id }, user);
      expect(batch.createdBy).toEqual({
        _id: user._id,
        key: user._id,
        username: user.username
      });
    });
  });
});
