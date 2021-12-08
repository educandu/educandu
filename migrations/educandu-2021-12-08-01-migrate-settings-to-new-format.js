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
export default class Educandu_2021_12_08_01_migrate_settings_to_new_format {
  constructor(db) {
    this.db = db;
  }

  async processValueDown(value) {
    const doc = await this.db.collection('documents').findOne({ key: value.documentKey });
    delete value.documentKey;
    value.namespace = doc.namespace;
  }

  async processValueUp(value) {
    const doc = await this.db.collection('documents').findOne({ namespace: value.namespace, slug: value.documentSlug });
    delete value.namespace;
    value.documentKey = doc.key;
  }

  async up() {
    await updateAll(this.db.collection('settings'), { _id: { $in: affectedSettings } }, async setting => {
      if (setting._id === 'footerLinks') {
        await Promise.all(Object.keys(setting.value)
          .map(key => setting.value[key]
            .map(value => this.processValueUp(value))).flat());
      } else {
        await Promise.all(Object.keys(setting.value).map(key => this.processValueUp(setting.value[key])));
      }
    });
  }

  async down() {
    await updateAll(this.db.collection('settings'), { _id: { $in: affectedSettings } }, async setting => {
      if (setting._id === 'footerLinks') {
        await Promise.all(Object.keys(setting.value)
          .map(key => setting.value[key]
            .map(value => this.processValueDown(value))).flat());
      } else {
        await Promise.all(Object.keys(setting.value).map(key => this.processValueDown(setting.value[key])));
      }
    });
  }
}
