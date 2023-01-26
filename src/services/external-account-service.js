import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import ServerConfig from '../bootstrap/server-config.js';
import ExternalAccountStore from '../stores/external-account-store.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

export default class ExternalAccountService {
  static get inject() {
    return [ExternalAccountStore, ServerConfig];
  }

  constructor(externalAccountStore, serverConfig) {
    this.externalAccountStore = externalAccountStore;
    this.serverConfig = serverConfig;
  }

  getAllProviders() {
    return this.serverConfig.samlAuth?.identityProviders || [];
  }

  getProvider(providerKey) {
    const provider = this.getAllProviders().find(prov => prov.key === providerKey);
    if (!provider) {
      throw new NotFound();
    }
    return provider;
  }

  getAllExternalAccounts() {
    return this.externalAccountStore.getAllExternalAccounts();
  }

  deleteExternalAccount({ externalAccountId }) {
    return this.externalAccountStore.deleteExternalAccount(externalAccountId);
  }

  createOrUpdateExternalAccountOnLogin({ providerKey, externalUserId }) {
    if (!providerKey || !externalUserId) {
      throw new BadRequest();
    }

    const provider = this.getProvider(providerKey);

    const lastLoggedInOn = new Date();
    const expiryTimeoutInMs = provider.expiryTimeoutInDays * 24 * 60 * 60 * 1000;
    const expiresOn = new Date(lastLoggedInOn.getTime() + expiryTimeoutInMs);

    logger.info(`Creating or updating external account for provider ${providerKey} and external user ${externalUserId}`);
    return this.externalAccountStore.createOrUpdateExternalAccountByProviderKeyAndExternalUserId({
      providerKey,
      externalUserId,
      lastLoggedInOn,
      expiresOn
    });
  }

  updateExternalAccountUserId({ externalAccountId, userId }) {
    logger.info(`Linking external account ${externalAccountId} with user ${userId}`);
    return this.externalAccountStore.updateExternalAccountUserId({ externalAccountId, userId });
  }
}
