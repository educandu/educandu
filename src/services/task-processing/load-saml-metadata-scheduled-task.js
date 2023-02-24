import SamlConfigService from '../saml-config-service.js';

export default class LoadSamlMetadataScheduledTask {
  static dependencies = [SamlConfigService];

  constructor(samlConfigService) {
    this.preventOverrun = true;
    this.key = 'load-saml-metadata';
    this.samlConfigService = samlConfigService;
    this.schedule = { minutes: 60, runImmediately: true };
  }

  async process() {
    await this.samlConfigService.resolveIdentityProviderMetadata();
  }
}
