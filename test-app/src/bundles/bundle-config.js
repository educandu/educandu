import DefaultSiteLogo from '../../../src/components/default-site-logo.js';
import DefaultPageTemplate from '../../../src/components/default-page-template.js';

export default {
  getPageTemplateComponent() {
    return DefaultPageTemplate;
  },
  getSiteLogoComponent() {
    return DefaultSiteLogo;
  }
};
