class Migration2021011201 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const oldSetting = await this.db.collection('settings').findOne({ _id: 'landingPageDocumentId' });
    const newSetting = {
      _id: 'homeLanguages',
      value: [
        {
          language: 'de',
          documentKey: oldSetting?.value || '',
          searchFieldButton: 'Suchen mit Google',
          searchFieldPlaceholder: 'Suchbegriff'
        }
      ]
    };

    await this.db.collection('settings').replaceOne({ _id: 'homeLanguages' }, newSetting, { upsert: true });
    await this.db.collection('settings').deleteOne({ _id: 'landingPageDocumentId' });
  }

  async down() {
    const oldSetting = await this.db.collection('settings').findOne({ _id: 'homeLanguages' });
    const newSetting = {
      _id: 'landingPageDocumentId',
      value: oldSetting.value?.[0]?.documentKey || ''
    };

    await this.db.collection('settings').replaceOne({ _id: 'landingPageDocumentId' }, newSetting, { upsert: true });
    await this.db.collection('settings').deleteOne({ _id: 'homeLanguages' });
  }
}

export default Migration2021011201;
