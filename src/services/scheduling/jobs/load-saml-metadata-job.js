import SamlConfigService from '../../saml-config-service.js';

export default class LoadSamlMetadataJob {
  static dependencies = [SamlConfigService];

  constructor(samlConfigService) {
    this.preventOverrun = true;
    this.name = 'load-saml-metadata';
    this.samlConfigService = samlConfigService;
    this.schedule = { minutes: 60, runImmediately: true };
  }

  async process() {
    await this.samlConfigService.resolveIdentityProviderMetadata();
  }
}
