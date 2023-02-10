const CDN_PORTABLE_URL_PREFIX = 'cdn://';
const CDN_ACCESSIBLE_URL_REGEX = /https:\/\/cdn.(elmu\.online|integration\.openmusic\.academy|staging\.openmusic\.academy|openmusic\.academy|)\//;

const OLD_ROOMS_CDN_PREFIX = 'cdn://rooms/';
const OLD_MEDIA_CDN_PREFIX = 'cdn://media/';

const redactUrl = (url = '') => {
  let portableUrl = url;

  if (CDN_ACCESSIBLE_URL_REGEX.test(url)) {
    portableUrl = url.replace(CDN_ACCESSIBLE_URL_REGEX, CDN_PORTABLE_URL_PREFIX);
  }

  if (portableUrl.startsWith(OLD_ROOMS_CDN_PREFIX)) {
    portableUrl = portableUrl
      .replace(OLD_ROOMS_CDN_PREFIX, 'cdn://room-media/')
      .replace('/media/', '/');
  }

  if (portableUrl.startsWith(OLD_MEDIA_CDN_PREFIX)) {
    portableUrl = portableUrl.replace(OLD_MEDIA_CDN_PREFIX, 'cdn://document-media/');
  }

  const isRedacted = url !== portableUrl;

  if (isRedacted) {
    console.log(`Redacted:\n  ${url}\n  ${portableUrl}`);
  }

  return {
    url: portableUrl,
    isRedacted
  };
};

export default class Educandu_2023_02_10_01_change_accessible_cdn_urls_catalog_external_link_types {
  constructor(db) {
    this.db = db;
  }

  updateDoc(doc) {
    let result;
    let isUpdated = false;

    doc.sections = doc.sections.map(section => {
      if (!section.content) {
        return section;
      }

      if (section.type === 'catalog') {
        for (const item of section.content.items) {
          if (item.link.sourceType === 'external') {
            result = redactUrl(item.link.sourceUrl);
            if (result.isRedacted) {
              item.link.sourceUrl = result.url;
              isUpdated = true;
            }
          }
        }
      }

      return section;
    });

    return { doc, isUpdated };
  }

  async processCollection(collectionName) {
    const cursor = this.db.collection(collectionName).find({});

    let counter = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const result = await this.updateDoc(doc);
      if (result.isUpdated) {
        counter += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, result.doc);
        console.log(`Updated ${collectionName} ${result.doc._id}`);
      }
    }

    console.log(`Updated ${counter} ${collectionName}`);
  }

  async up() {
    await this.processCollection('documentRevisions');
    await this.processCollection('documents');
  }

  down() {
    throw new Error('Not supported');
  }
}
