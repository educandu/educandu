export default class Educandu_2022_05_09_02_remove_documentSlug_from_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const settingsCollection = this.db.collection('settings');
    await settingsCollection.updateOne({ _id: 'templateDocument' }, { $unset: { 'value.documentSlug': null } });

    const termsPage = await settingsCollection.findOne({ _id: 'termsPage' });
    if (termsPage?.value) {
      for (const termsPageLanguage of Object.keys(termsPage.value)) {
        delete termsPage.value[termsPageLanguage].documentSlug;
      }
      await settingsCollection.replaceOne({ _id: 'termsPage' }, termsPage);
    }

    const footerLinks = await settingsCollection.findOne({ _id: 'footerLinks' });
    if (footerLinks?.value) {
      for (const footerLanguage of Object.keys(footerLinks.value)) {
        for (const footerLink of footerLinks.value[footerLanguage]) {
          delete footerLink.documentSlug;
        }
      }
      await settingsCollection.replaceOne({ _id: 'footerLinks' }, footerLinks);
    }
  }

  async down() {
    const settingsCollection = this.db.collection('settings');
    await settingsCollection.updateOne({ _id: 'templateDocument' }, { $set: { 'value.documentSlug': '' } });

    const termsPage = await settingsCollection.findOne({ _id: 'termsPage' });
    if (termsPage?.value) {
      for (const termsPageLanguage of Object.keys(termsPage.value)) {
        termsPage.value[termsPageLanguage].documentSlug = '';
      }
      await settingsCollection.replaceOne({ _id: 'termsPage' }, termsPage);
    }

    const footerLinks = await settingsCollection.findOne({ _id: 'footerLinks' });
    if (footerLinks?.value) {
      for (const footerLanguage of Object.keys(footerLinks.value)) {
        for (const footerLink of footerLinks.value[footerLanguage]) {
          footerLink.documentSlug = '';
        }
      }
      await settingsCollection.replaceOne({ _id: 'footerLinks' }, footerLinks);
    }
  }
}
