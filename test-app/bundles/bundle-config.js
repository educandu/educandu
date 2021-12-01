export default {
  async getPageTemplateComponent(pageName) {
    switch (pageName) {
      case 'non-existent-page':
        throw new Error('This page does not exist!');
      default:
        return (await import('../../src/components/page.js')).default;
    }
  }
};
