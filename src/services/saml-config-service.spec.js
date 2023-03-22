import { createSandbox } from 'sinon';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import SamlConfigService from './saml-config-service.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('saml-config-service', () => {
  let sut;
  let container;

  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(SamlConfigService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {});

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('resolveMetadata', () => {
    let testXml;

    beforeEach(async () => {
      const testDocFileName = fileURLToPath(new URL('./saml-config-service-test-file.xml', import.meta.url));
      testXml = await fs.readFile(testDocFileName, 'utf8');
    });

    it('parses the metadata correctly for an existing entity ID', async () => {
      const metadata = await sut.resolveMetadata(testXml, 'https://samltest.id/saml/idp');
      expect(metadata).toStrictEqual({
        entryPoint: 'https://samltest.id/idp/profile/SAML2/Redirect/SSO',
        certificates: [expect.any(String), expect.any(String), expect.any(String)]
      });
    });

    it('returns null for a non-existing entity ID', async () => {
      const metadata = await sut.resolveMetadata(testXml, 'https://somewhere.over/the/rainbow');
      expect(metadata).toBe(null);
    });
  });

});
