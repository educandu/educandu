import { ObjectId } from 'mongodb';
import moment from 'moment/moment.js';
import ServerConfig from '../bootstrap/server-config.js';
import SearchRequestStore from '../stores/search-request-store.js';

class SearchRequestService {
  static dependencies = [SearchRequestStore, ServerConfig];

  constructor(searchRequestStore, serverConfig) {
    this.searchRequestStore = searchRequestStore;
    this.serverConfig = serverConfig;
  }

  getSearchRequests({ registeredFrom, registeredUntil } = {}) {
    return this.searchRequestStore.getSearchRequests({ registeredFrom, registeredUntil });
  }

  async createSearchRequest({ query, documentMatchCount, mediaLibraryItemMatchCount }) {
    const registeredOn = new Date();
    const expiresOn = moment(registeredOn).add(this.serverConfig.searchRequestExpiryTimeoutInDays, 'days').toDate();

    const newSearchRequest = {
      _id: new ObjectId(),
      query,
      documentMatchCount,
      mediaLibraryItemMatchCount,
      registeredOn,
      expiresOn
    };

    await this.searchRequestStore.saveSearchRequest(newSearchRequest);

    return newSearchRequest;
  }
}

export default SearchRequestService;
