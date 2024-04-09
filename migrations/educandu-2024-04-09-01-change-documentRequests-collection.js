export default class Educandu_2024_04_09_01_change_documentRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRequests').dropIndex('_idx_documentId_registeredOn_registeredOnDayOfWeek_type_isUserLoggedIn');

    await this.db.collection('documentRequests').updateMany(
      {},
      { $rename:
        {
          isUserLoggedIn: 'isLoggedInRequest',
          type: 'isWriteRequest'
        } }
    );

    await this.db.collection('documentRequests').updateMany({ isWriteRequest: 'read' }, { $set: { isWriteRequest: false } });
    await this.db.collection('documentRequests').updateMany({ isWriteRequest: 'write' }, { $set: { isWriteRequest: true } });

    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Mon' }, { $set: { registeredOnDayOfWeek: 1 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Tue' }, { $set: { registeredOnDayOfWeek: 2 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Wed' }, { $set: { registeredOnDayOfWeek: 3 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Thu' }, { $set: { registeredOnDayOfWeek: 4 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Fri' }, { $set: { registeredOnDayOfWeek: 5 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Sat' }, { $set: { registeredOnDayOfWeek: 6 } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 'Sun' }, { $set: { registeredOnDayOfWeek: 7 } });

    await this.db.collection('documentRequests').createIndexes([
      {
        name: '_idx_documentId_registeredOn_registeredOnDayOfWeek_isWriteRequest_isLoggedInRequest',
        key: { documentId: 1, registeredOn: 1, registeredOnDayOfWeek: 1, isWriteRequest: 1, isLoggedInRequest: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('documentRequests').dropIndex('_idx_documentId_registeredOn_registeredOnDayOfWeek_isWriteRequest_isLoggedInRequest');

    await this.db.collection('documentRequests').updateMany(
      {},
      { $rename:
        {
          isLoggedInRequest: 'isUserLoggedIn',
          isWriteRequest: 'type'
        } }
    );

    await this.db.collection('documentRequests').updateMany({ type: false }, { $set: { type: 'read' } });
    await this.db.collection('documentRequests').updateMany({ type: true }, { $set: { type: 'write' } });

    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 1 }, { $set: { registeredOnDayOfWeek: 'Mon' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 2 }, { $set: { registeredOnDayOfWeek: 'Tue' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 3 }, { $set: { registeredOnDayOfWeek: 'Wed' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 4 }, { $set: { registeredOnDayOfWeek: 'Thu' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 5 }, { $set: { registeredOnDayOfWeek: 'Fri' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 6 }, { $set: { registeredOnDayOfWeek: 'Sat' } });
    await this.db.collection('documentRequests').updateMany({ registeredOnDayOfWeek: 7 }, { $set: { registeredOnDayOfWeek: 'Sun' } });

    await this.db.collection('documentRequests').createIndexes([
      {
        name: '_idx_documentId_registeredOn_registeredOnDayOfWeek_type_isUserLoggedIn',
        key: { documentId: 1, registeredOn: 1, registeredOnDayOfWeek: 1, type: 1, isUserLoggedIn: 1 }
      }
    ]);
  }
}
