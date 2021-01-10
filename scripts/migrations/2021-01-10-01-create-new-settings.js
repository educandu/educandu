class Migration2021011001 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const oldSetting = await this.db.collection('settings').findOne({ _id: 'landingPageDocumentId' });
    const newSetting = {
      _id: 'landingPage',
      value: {
        documentKeys: {
          de: oldSetting.value
        },
        defaultLanguage: 'de'
      }
    };

    await this.db.collection('settings').replaceOne({ _id: 'landingPage' }, newSetting, { upsert: true });
    await this.db.collection('settings').deleteOne({ _id: 'landingPageDocumentId' });
  }

  async down() {
    const oldSetting = await this.db.collection('settings').findOne({ _id: 'landingPage' });
    const newSetting = {
      _id: 'landingPageDocumentId',
      value: oldSetting.value.documentKeys.de
    };

    await this.db.collection('settings').replaceOne({ _id: 'landingPageDocumentId' }, newSetting, { upsert: true });
    await this.db.collection('settings').deleteOne({ _id: 'landingPage' });
  }
}

export default Migration2021011001;
