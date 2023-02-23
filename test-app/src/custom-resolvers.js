import ServerTimeInfo from './custom-plugin/server-time-info.js';
import HomepageTemplate from './custom-components/homepage-template.js';

export default {
  resolveCustomPageTemplate: null,
  resolveCustomHomePageTemplate: () => HomepageTemplate,
  resolveCustomSiteLogo: null,
  resolveCustomPluginInfos: () => [ServerTimeInfo]
};
