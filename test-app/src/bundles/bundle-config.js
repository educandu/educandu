import SiteLogo from './site-logo.js';
import HomePageTemplate from './home-page-template.js';
import DefaultPageTemplate from '../../../src/components/default-page-template.js';

export default {
  getPageTemplateComponent() {
    return DefaultPageTemplate;
  },
  getHomePageTemplateComponent() {
    return HomePageTemplate;
  },
  getSiteLogoComponent() {
    return SiteLogo;
  }
};
