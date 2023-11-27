import joi from 'joi';
import { customAlphabet } from 'nanoid';

const createUniqueId = customAlphabet('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', 22);

const validateKeysAreUnique = arrayToValidate => joi.attempt(
  arrayToValidate,
  joi.array().items(joi.object({ key: joi.string().required() })).unique('key'),
  { abortEarly: false, convert: false, allowUnknown: true, noDefaults: true }
);

export default class Educandu_2023_11_23_01_fix_unique_keys_in_section_contents {
  constructor(db) {
    this.db = db;
    this.replacementIds = Array.from({ length: 100 }, () => createUniqueId());
  }

  fixUniqueKeysInArray(items) {
    let replacementIdIndex = 0;
    let duplicateKeyFound = false;
    const processedKeys = new Set();

    for (const item of items) {
      if (processedKeys.has(item.key)) {
        item.key = this.replacementIds[replacementIdIndex];
        duplicateKeyFound = true;
        replacementIdIndex += 1;
      }
      processedKeys.add(item.key);
    }

    validateKeysAreUnique(items);
    return duplicateKeyFound;
  }

  async collectionUp(collectionName) {
    const sectionsToFix = [
      {
        type: 'catalog',
        getArraysToFix: content => [content.items],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'ear-training',
        getArraysToFix: content => [content.tests],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'interactive-media',
        getArraysToFix: content => [content.chapters],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'media-analysis',
        getArraysToFix: content => [content.tracks, content.chapters],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'media-slideshow',
        getArraysToFix: content => [content.chapters],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'multitrack-media',
        getArraysToFix: content => [content.tracks],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'quick-tester',
        getArraysToFix: content => [content.tests],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      },
      {
        type: 'select-field',
        getArraysToFix: content => [content.items],
        affectedSectionKeys: new Set(),
        affectedDocumentIds: new Set()
      }
    ];

    const affectedSectionTypes = sectionsToFix.map(stf => stf.type);
    const cursor = this.db.collection(collectionName).find({ 'sections.type': { $in: affectedSectionTypes } });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      for (const section of doc.sections.filter(s => !!s.content)) {
        const fixInfo = sectionsToFix.find(stf => stf.type === section.type);
        if (fixInfo) {
          const arraysToFix = fixInfo.getArraysToFix(section.content);
          for (const arrayToFix of arraysToFix) {
            if (this.fixUniqueKeysInArray(arrayToFix)) {
              fixInfo.affectedDocumentIds.add(doc._id);
              fixInfo.affectedSectionKeys.add(section.key);
            }
          }
        }
      }

      if (sectionsToFix.some(stf => stf.affectedDocumentIds.has(doc._id))) {
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    const totalMigratedDocumentCount = new Set(sectionsToFix.flatMap(stf => [...stf.affectedDocumentIds])).size;
    console.log(`Migrated ${totalMigratedDocumentCount} documents in collection '${collectionName}'`);
    for (const stf of sectionsToFix) {
      console.log(`  * ${stf.affectedSectionKeys.size} '${stf.type}' sections in ${stf.affectedDocumentIds.size} documents`);
    }
  }

  async up() {
    await this.collectionUp('documents');
    await this.collectionUp('documentRevisions');
  }

  down() {
    throw Error('Not supported');
  }
}
