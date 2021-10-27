/* eslint-disable no-console */

import Cdn from '../src/repositories/cdn.js';
import testHelper from '../src/test-helper.js';
import serverBootstrapper from '../src/bootstrap/server-bootstrapper.js';

(async function seed() {
  const container = await serverBootstrapper.createContainer();

  console.log('Getting cdn');
  const cdn = container.get(Cdn);

  console.log('Removing cdn buckets');
  await testHelper.removeAllBuckets(cdn);

  console.log('Ensuring cdn buckets exist');
  await testHelper.ensurePublicBucketExists(cdn);

  console.log('Disposing container');
  await serverBootstrapper.disposeContainer(container);
})();
