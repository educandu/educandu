import HomePageTemplate from './home-page-template.js';
import DefaultSiteLogo from '../../../src/components/default-site-logo.js';
import DefaultPageTemplate from '../../../src/components/default-page-template.js';

export default {
  getPageTemplateComponent() {
    return DefaultPageTemplate;
  },
  getHomePageTemplateComponent() {
    return HomePageTemplate;
  },
  getSiteLogoComponent() {
    return DefaultSiteLogo;
  }
};
