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

// eslint-disable-next-line camelcase
export default class Educandu_2021_12_10_01_migrate_image_tiles_to_use_docs {
  constructor(db) {
    this.db = db;
  }

  collectLinks(sections, type) {
    return sections
      .filter(section => section.type === 'image-tiles' && Array.isArray(section.content?.tiles))
      .flatMap(section => section.content.tiles.map(tile => tile.link))
      .filter(link => link?.type === type && link?.url);
  }

  async up() {
    await updateAll(this.db.collection('documents'), { 'sections.type': 'image-tiles' }, async doc => {
      const links = this.collectLinks(doc.sections, 'article');
      if (!links.length) {
        return null;
      }

      for (const link of links) {
        /* eslint-disable-next-line no-await-in-loop */
        const linkedDoc = await this.db.collection('documents').find({ namespace: 'articles', slug: link.url });
        link.url = linkedDoc?.key;
        link.type = 'internal';
      }

      return doc;
    });

    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'image-tiles' }, async doc => {
      const links = this.collectLinks(doc.sections, 'article');
      if (!links.length) {
        return null;
      }

      for (const link of links) {
        /* eslint-disable-next-line no-await-in-loop */
        const linkedDoc = await this.db.collection('documents').find({ namespace: 'articles', slug: link.url });
        link.url = linkedDoc?.key;
        link.type = 'internal';
      }

      return doc;
    });
  }

  async down() {
    await updateAll(this.db.collection('documents'), { 'sections.type': 'image-tiles' }, async doc => {
      const links = this.collectLinks(doc.sections, 'internal');
      if (!links.length) {
        return null;
      }

      for (const link of links) {
        /* eslint-disable-next-line no-await-in-loop */
        const linkedDoc = await this.db.collection('documents').find({ key: link.url });
        link.url = linkedDoc?.slug;
        link.type = 'article';
      }

      return doc;
    });

    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'image-tiles' }, async doc => {
      const links = this.collectLinks(doc.sections, 'internal');
      if (!links.length) {
        return null;
      }

      for (const link of links) {
        /* eslint-disable-next-line no-await-in-loop */
        const linkedDoc = await this.db.collection('documents').find({ key: link.url });
        link.url = linkedDoc?.slug;
        link.type = 'article';
      }

      return doc;
    });
  }
}
