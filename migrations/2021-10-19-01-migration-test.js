class Migration2021110191 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db
      .collection('menus')
      .insertOne({
        _id: 'mambojumbo',
        title: 'Test migration',
        slug: 'testMigration',
        createdOn: '2018-09-16T22:20:39.879Z',
        updatedOn: '2021-10-13T19:47:29.663Z',
        createdBy: {
          id: 'mnVFiCCW9UkyJNPANMroDZ'
        },
        updatedBy: {
          id: '5N1dTg7322RxLeWP3zi1Ys'
        },
        defaultDocumentKey: 'mYUgPSeW5z1JsM11veK43y',
        nodes: []
      });
  }

  async down() {
    await this.db
      .collection('menus')
      .deleteOne({ _id: 'mambojumbo' });
  }
}

export default Migration2021110191;
