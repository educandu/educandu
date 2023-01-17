import xpath from 'xpath';
import xmldom from 'xmldom';
import memoizee from 'memoizee';
import HttpClient from '../api-clients/http-client.js';
import ServerConfig from '../bootstrap/server-config.js';

const { DOMParser } = xmldom;

const REQUEST_TIMEOUT_IN_MS = 30 * 1000;
const REDIRECT_BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';

const xpathSelect = xpath.useNamespaces({
  sm: 'urn:oasis:names:tc:SAML:2.0:metadata',
  ds: 'http://www.w3.org/2000/09/xmldsig#'
});

export default class SamlConfigService {
  static get inject() { return [ServerConfig, HttpClient]; }

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

  async loadXmlDoc(url) {
    try {
      const response = await this.httpClient.get(url, { responseType: 'text', timeout: REQUEST_TIMEOUT_IN_MS });
      return new DOMParser().parseFromString(response.data);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Timeout trying to fetch "${url}"`);
      } else {
        throw error;
      }
    }
  }

  resolveMetadata(xmlDoc, entityId) {
    const descriptorRootXpath = `sm:EntityDescriptor[@entityID="${entityId}"]/sm:IDPSSODescriptor`;

    const certificatesXpath = `//${descriptorRootXpath}/sm:KeyDescriptor//ds:X509Certificate`;
    const certificates = xpathSelect(certificatesXpath, xmlDoc).map(c => c.textContent.trim() || null).filter(c => c);

    const entryPointXpath = `//${descriptorRootXpath}/sm:SingleSignOnService[@Binding="${REDIRECT_BINDING}"]/@Location`;
    const entryPoint = xpathSelect(entryPointXpath, xmlDoc)[0]?.value.trim() || null;

    return !!entryPoint && !!certificates.length
      ? {
        entryPoint,
        certificates
      }
      : null;
  }

  async resolveIdentityProviderMetadata() {
    const loadXmlDocMemoized = memoizee(url => this.loadXmlDoc(url), { promise: true });

    for (const provider of this.serverConfig.samlAuth?.identityProviders || []) {
      const xml = await loadXmlDocMemoized(provider.metadata.url);
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
