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
    let test1Xml;
    let test2Xml;

    beforeEach(async () => {
      const testFile1Name = fileURLToPath(new URL('./saml-config-service-test-file-1.xml', import.meta.url));
      const testFile2Name = fileURLToPath(new URL('./saml-config-service-test-file-2.xml', import.meta.url));
      test1Xml = await fs.readFile(testFile1Name, 'utf8');
      test2Xml = await fs.readFile(testFile2Name, 'utf8');
    });

    it('parses the metadata correctly for an existing entity ID', async () => {
      const metadata = await sut.resolveMetadata(test1Xml, 'https://samltest.id/saml/idp');
      expect(metadata).toStrictEqual({
        entryPoint: 'https://samltest.id/idp/profile/SAML2/Redirect/SSO',
        certificates: [expect.any(String), expect.any(String), expect.any(String)]
      });
    });

    it('returns null for a non-existing entity ID', async () => {
      const metadata = await sut.resolveMetadata(test1Xml, 'https://somewhere.over/the/rainbow');
      expect(metadata).toBe(null);
    });

    it('parses the metadata correctly for an existing entity ID amongst multiple descriptors', async () => {
      const metadata = await sut.resolveMetadata(test2Xml, 'https://login.rz.rwth-aachen.de/shibboleth');
      expect(metadata).toStrictEqual({
        entryPoint: 'https://sso.rwth-aachen.de/idp/profile/SAML2/Redirect/SSO',
        certificates: [expect.any(String)]
      });
    });
  });

});
