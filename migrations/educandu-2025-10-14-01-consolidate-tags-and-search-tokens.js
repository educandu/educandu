function ensureIsUnique(items) {
  const itemsAsSet = new Set(items);
  return itemsAsSet.size !== items.length ? [...itemsAsSet] : items;
}

export default class Educandu_2025_10_14_01_consolidate_tags_and_search_tokens {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName, subObjectKey = null) {
    console.log('------------------------------------------------------------');
    console.log(`Processing collection ${collectionName}`);

    const docsIterator = await this.db.collection(collectionName).find({});

    let updatedDocCount = 0;

    for await (const doc of docsIterator) {
      const actualObject = subObjectKey ? doc[subObjectKey] : doc;
      const oldTags = actualObject.tags;
      const oldSearchTokens = actualObject.searchTokens;
      const newTags = ensureIsUnique(oldTags);
      const newSearchTokens = ensureIsUnique(oldSearchTokens);

      if (oldTags !== newTags || oldSearchTokens !== newSearchTokens) {
        const nameOrTitle = String(doc.name || doc.title || 'n/a');
        const shortenedNameOrTitle = nameOrTitle.length > 25 ? `${nameOrTitle.slice(0, 22)}...` : nameOrTitle;

        console.log(`* Updating document with ID ${doc._id}: "${shortenedNameOrTitle}"`);
        console.log(`  * tags (old): [${oldTags.join()}]`);
        console.log(`  * tags (new): [${newTags.join()}]`);
        console.log(`  * searchTokens (old): [${oldSearchTokens.join()}]`);
        console.log(`  * searchTokens (new): [${newSearchTokens.join()}]`);

        const tagsPath = subObjectKey ? `${subObjectKey}.tags` : 'tags';
        const searchTokensPath = subObjectKey ? `${subObjectKey}.searchTokens` : 'searchTokens';
        await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { [tagsPath]: newTags, [searchTokensPath]: newSearchTokens } });

        updatedDocCount += 1;
      }
    }

    console.log(`Updated ${updatedDocCount} documents in collection ${collectionName}`);
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
    await this.collectionUp('mediaLibraryItems');
    await this.collectionUp('mediaTrashItems', 'originalItem');
  }

  down() {
    throw new Error('Not supported');
  }
}
