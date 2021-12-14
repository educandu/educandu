async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  /* eslint-disable-next-line no-await-in-loop */
  while (await cursor.hasNext()) {
    /* eslint-disable-next-line no-await-in-loop */
    const doc = await cursor.next();
    /* eslint-disable-next-line no-await-in-loop */
    const updatedDoc = await updateFn(doc);
    if (updatedDoc) {
      /* eslint-disable-next-line no-await-in-loop */
      await collection.replaceOne({ _id: doc._id }, updatedDoc);
    }
  }
}

export function processSection(section) {
  let updateCount = 0;
  if (section.type === 'markdown' && section.content) {
    const regexp = /\]\((https:\/\/((staging\.)?cdn\.elmu\.online)|(https:\/\/cdn\.((integration|staging)\.)?openmusic\.academy))\//g;
    section.content = section.content.replace(regexp, () => {
      updateCount += 1;
      return '](cdn://';
    });
  }

  return updateCount;
}

// eslint-disable-next-line camelcase
export default class Educandu_2021_12_13_01_make_cdn_urls_generic {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'markdown' }, doc => {
      const updateCount = doc.sections.reduce((accu, section) => accu + processSection(section), 0);
      // eslint-disable-next-line no-console
      console.log(`Replacing ${updateCount} links/images in document revision ${doc._id}`);
      return updateCount ? doc : null;
    });

    await updateAll(this.db.collection('documents'), { 'sections.type': 'markdown' }, doc => {
      const updateCount = doc.sections.reduce((accu, section) => accu + processSection(section), 0);
      // eslint-disable-next-line no-console
      console.log(`Replacing ${updateCount} links/images in document ${doc._id}`);
      return updateCount ? doc : null;
    });
  }

  down() {
    throw new Error('This operation is not possible');
  }
}
