import Cdn from '../src/repositories/cdn.js';
import testHelper from '../src/test-helper.js';
import Database from '../src/stores/database.js';
import serverBootstrapper from '../src/bootstrap/server-bootstrapper.js';

(async function pruneEnv() {

  const container = await serverBootstrapper.createContainer();

  // CDN
  const cdn = container.get(Cdn);
  await testHelper.purgeBucket(cdn);

  // DB
  const db = container.get(Database);
  await testHelper.dropAllCollections(db);

  await serverBootstrapper.disposeContainer(container);

})();
