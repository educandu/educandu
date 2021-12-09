import SiteLogoComponent from '../../src/components/default-site-logo.js';
import PageTemplateComponent from '../../src/components/default-page-template.js';

export default {
  getPageTemplateComponent() {
    return PageTemplateComponent;
  },
  getSiteLogoComponent() {
    return SiteLogoComponent;
  }
};
