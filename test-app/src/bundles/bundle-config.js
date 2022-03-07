import SiteLogo from './site-logo.js';
import PageTemplate from './page-template.js';
import HomePageTemplate from './home-page-template.js';

export default {
  getPageTemplateComponent() {
    return PageTemplate;
  },
  getHomePageTemplateComponent() {
    return HomePageTemplate;
  },
  getSiteLogoComponent() {
    return SiteLogo;
  }
};
