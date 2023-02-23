import HomepageTemplate from './homepage-template.js';
import ServerTimeInfo from '../test-plugin/server-time-info.js';

export default {
  getPageTemplateComponent() {
    return null;
  },
  getHomePageTemplateComponent() {
    return HomepageTemplate;
  },
  getSiteLogoComponent() {
    return null;
  },
  resolvePluginInfo(name) {
    return name === ServerTimeInfo.typeName ? ServerTimeInfo : null;
  }
};
