import sax from 'sax';
import memoizee from 'memoizee';
import HttpClient from '../api-clients/http-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import { ensureIsUnique } from '../utils/array-utils.js';

const REQUEST_TIMEOUT_IN_MS = 30 * 1000;
const XMLSN_URI_DS = 'http://www.w3.org/2000/09/xmldsig#';
const XMLNS_URI_SM = 'urn:oasis:names:tc:SAML:2.0:metadata';
const REDIRECT_BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';

export default class SamlConfigService {
  static dependencies = [ServerConfig, HttpClient];

  constructor(serverConfig, httpClient) {
    this.httpClient = httpClient;
    this.serverConfig = serverConfig;
    this._identityProviderMap = new Map();
  }

  getIdentityProviders() {
    return [...this._identityProviderMap.values()];
  }

  getIdentityProviderByKey(providerKey) {
    return this._identityProviderMap.get(providerKey) || null;
  }

  async loadXml(url) {
    try {
      const response = await this.httpClient.get(url, { responseType: 'text', timeout: REQUEST_TIMEOUT_IN_MS });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Timeout trying to fetch "${url}"`);
      } else {
        throw error;
      }
    }
  }

  resolveMetadata(xml, entityId) {
    return new Promise((resolve, reject) => {
      let entryPoint = null;
      let certificates = [];
      let currentEntityIdValue = null;
      let readNextTextAsCertificate = false;

      const parser = sax.parser(true, { xmlns: true });

      parser.onopentag = node => {
        if (node.local === 'EntityDescriptor' && node.uri === XMLNS_URI_SM) {
          currentEntityIdValue = node.attributes.entityID?.value || null;
        }

        if (currentEntityIdValue !== entityId) {
          return;
        }

        // From here on we can be sure that we are inside the `EntityDescriptor`
        // parent element belonging to the `entityId` we are interested in.

        if (node.local === 'X509Certificate' && node.uri === XMLSN_URI_DS) {
          readNextTextAsCertificate = true;
          return;
        }

        if (node.local === 'SingleSignOnService' && node.uri === XMLNS_URI_SM) {
          let isRedirectBinding = false;
          let foundEntryPoint = null;
          for (const attr of Object.values(node.attributes)) {
            if (attr.local === 'Binding' && attr.uri === '' && attr.value === REDIRECT_BINDING) {
              isRedirectBinding = true;
            }
            if (attr.local === 'Location' && attr.uri === '' && !!attr.value) {
              foundEntryPoint = attr.value;
            }
          }

          if (isRedirectBinding && !!foundEntryPoint) {
            entryPoint = foundEntryPoint;
          }
        }
      };

      parser.onclosetag = () => {
        readNextTextAsCertificate = false;
      };

      parser.ontext = text => {
        if (readNextTextAsCertificate) {
          const trimmedCert = text.trim();
          if (trimmedCert) {
            certificates = ensureIsUnique([...certificates, trimmedCert]);
          }
        }
      };

      parser.onerror = error => {
        reject(error);
      };

      parser.onend = () => {
        const result = !!entryPoint && !!certificates.length
          ? { entryPoint, certificates }
          : null;

        resolve(result);
      };

      parser.write(xml).close();
    });

  }

  async resolveIdentityProviderMetadata() {
    const loadXmlMemoized = memoizee(url => this.loadXml(url), { promise: true });

    for (const provider of this.serverConfig.samlAuth?.identityProviders || []) {
      const xml = await loadXmlMemoized(provider.metadata.url);
      const resolvedMetadata = this.resolveMetadata(xml, provider.metadata.entityId);
      if (resolvedMetadata) {
        this._identityProviderMap.set(provider.key, {
          ...provider,
          resolvedMetadata,
          lastUpdatedOn: new Date()
        });
      }
    }
  }
}
