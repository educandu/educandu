/* eslint-disable no-await-in-loop, no-console */

class Migration2020122803 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const cursor = this.db.collection('documentRevisions').aggregate([{ $group: { _id: '$key' } }]);
    while (await cursor.hasNext()) {
      const group = await cursor.next();
      console.log(`Creating document for revision key ${group._id}`);
      const revisions = await this.db.collection('documentRevisions').find({ key: group._id }, { sort: [['order', 1]] }).toArray();
      const doc = this.createDocFromRevisions(revisions);
      await this.db.collection('documents').insert(doc);
    }
  }

  async down() {
    await this.db.collection('documents').drop();
  }

  createDocFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = Array.from(new Set(revisions.map(r => r.createdBy)));

    return {
      _id: lastRevision.key,
      key: lastRevision.key,
      order: lastRevision.order,
      revision: lastRevision._id,
      createdOn: firstRevision.createdOn,
      createdBy: firstRevision.createdBy,
      updatedOn: lastRevision.createdOn,
      updatedBy: lastRevision.createdBy,
      title: lastRevision.title,
      slug: lastRevision.slug,
      namespace: lastRevision.namespace,
      language: lastRevision.language,
      sections: lastRevision.sections,
      contributors: contributors
    };
  }
}

export default Migration2020122803;
