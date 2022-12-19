async function updateAll(collection, query, updateFn) {
  const cursor = collection.find(query);

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const updatedDoc = await updateFn(doc);
    if (updatedDoc) {
      await collection.replaceOne({ _id: doc._id }, updatedDoc);
    }
  }
}

export function processSection(section) {
  let updateCount = 0;
  if (section.type === 'annotation' && section.content) {
    const regexp = /\]\((https:\/\/((staging\.)?cdn\.elmu\.online)|(https:\/\/cdn\.((integration|staging)\.)?openmusic\.academy))\//g;
    section.content.text = section.content.text.replace(regexp, () => {
      updateCount += 1;
      return '](cdn://';
    });
  }

  return updateCount;
}

export default class Educandu_2021_12_16_01_make_cdn_urls_generic_in_annotations {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'annotation' }, doc => {
      const updateCount = doc.sections.reduce((accu, section) => accu + processSection(section), 0);
      console.log(`Replacing ${updateCount} links/images in document revision ${doc._id}`);
      return updateCount ? doc : null;
    });

    await updateAll(this.db.collection('documents'), { 'sections.type': 'annotation' }, doc => {
      const updateCount = doc.sections.reduce((accu, section) => accu + processSection(section), 0);
      console.log(`Replacing ${updateCount} links/images in document ${doc._id}`);
      return updateCount ? doc : null;
    });
  }

  down() {
    throw new Error('This operation is not possible');
  }
}
