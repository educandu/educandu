/* eslint-disable no-await-in-loop, no-console */

class Migration2020122802 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const cursor = this.db.collection('documentSnapshots').find({}, { sort: { order: 1 } });
    while (await cursor.hasNext()) {
      const snapshot = await cursor.next();
      console.log(`Creating revision ${snapshot._id} of '${snapshot.title}'`);
      const revision = await this.createRevisionFromSnapshot(snapshot);
      await this.db.collection('documentRevisions').insert(revision);
    }
  }

  async down() {
    await this.db.collection('documentRevisions').drop();
  }

  async createRevisionFromSnapshot(snapshot) {
    const sectionIds = snapshot.sections.map(s => s.id);
    const sections = await this.db.collection('sections').find({ _id: { $in: sectionIds } }).toArray();
    const sectionsByIds = sections.reduce((accu, item) => {
      accu[item._id] = item;
      return accu;
    }, {});

    return {
      _id: snapshot._id,
      key: snapshot.key,
      order: snapshot.order,
      createdOn: snapshot.createdOn,
      createdBy: snapshot.createdBy.id,
      title: snapshot.title,
      slug: snapshot.slug,
      namespace: 'articles',
      language: 'de',
      sections: snapshot.sections.map(s => this.createRevisionSection(sectionsByIds[s.id]))
    };
  }

  createRevisionSection(section) {
    return {
      key: section.key,
      revision: section._id,
      deletedOn: section.deletedOn || null,
      deletedBy: section.deletedBy ? section.deletedBy.id || null : null,
      deletedBecause: typeof section.deletedBecause === 'string' ? section.deletedBecause : null,
      type: section.type,
      content: section.content ? section.content.de || null : null
    };
  }
}

export default Migration2020122802;
