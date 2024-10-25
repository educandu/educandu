import { isInternalSourceType } from '../../utils/source-utils.js';

export default class MediaDownloader {
  constructor(httpClient, clientConfig) {
    this.httpClient = httpClient;
    this.clientConfig = clientConfig;
  }

  async downloadMedia(sourceUrl) {
    const withCredentials = isInternalSourceType({
      url: sourceUrl,
      cdnRootUrl: this.clientConfig.cdnRootUrl
    });

    const response = await this.httpClient.get(sourceUrl, { responseType: 'arraybuffer', withCredentials });
    return response.data;
  }
}
