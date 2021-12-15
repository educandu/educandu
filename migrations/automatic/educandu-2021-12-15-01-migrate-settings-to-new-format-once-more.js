async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  /* eslint-disable-next-line no-await-in-loop */
  while (await cursor.hasNext()) {
    /* eslint-disable-next-line no-await-in-loop */
    const doc = await cursor.next();
    /* eslint-disable-next-line no-await-in-loop */
    await updateFn(doc);
    /* eslint-disable-next-line no-await-in-loop */
    await collection.replaceOne({ _id: doc._id }, doc);
  }
}

const affectedSettings = ['footerLinks', 'helpPage', 'termsPage'];

// eslint-disable-next-line camelcase
export default class Educandu_2021_12_15_01_migrate_settings_to_new_format_once_more {
  constructor(db) {
    this.db = db;
  }

  async processValueDown(value) {
    const doc = await this.db.collection('documents').findOne({ key: value.documentKey });
    delete value.documentKey;
    value.documentNamespace = doc?.namespace;
  }

  async processValueUp(value) {
    const doc = await this.db.collection('documents').findOne({ namespace: value.documentNamespace, slug: value.documentSlug });
    delete value.documentNamespace;
    value.documentKey = doc?.key;
  }

  async up() {
    await updateAll(this.db.collection('settings'), { _id: { $in: affectedSettings } }, async setting => {
      if (setting._id === 'footerLinks') {
        await Promise.all(Object.keys(setting.value)
          .flatMap(key => setting.value[key].map(value => this.processValueUp(value))));
      } else {
        await Promise.all(Object.keys(setting.value).map(key => this.processValueUp(setting.value[key])));
      }
    });
  }

  async down() {
    await updateAll(this.db.collection('settings'), { _id: { $in: affectedSettings } }, async setting => {
      if (setting._id === 'footerLinks') {
        await Promise.all(Object.keys(setting.value)
          .flatMap(key => setting.value[key].map(value => this.processValueDown(value))));
      } else {
        await Promise.all(Object.keys(setting.value).map(key => this.processValueDown(setting.value[key])));
      }
    });
  }
}
