class Migration2021011202 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').replaceOne({ _id: 'helpPage' }, {
      _id: 'helpPage',
      value: {
        de: { linkTitle: 'Hilfe', documentNamespace: 'articles', documentSlug: 'hilfe' }
      }
    }, { upsert: true });

    await this.db.collection('settings').replaceOne({ _id: 'termsPage' }, {
      _id: 'termsPage',
      value: {
        de: { linkTitle: 'Nutzungsbedingungen', documentNamespace: 'articles', documentSlug: 'nutzungsvertrag' }
      }
    }, { upsert: true });

    await this.db.collection('settings').replaceOne({ _id: 'footerLinks' }, {
      _id: 'footerLinks',
      value: {
        de: [
          { linkTitle: 'Über ELMU', documentNamespace: 'articles', documentSlug: 'ueber-elmu' },
          { linkTitle: 'Organisation', documentNamespace: 'articles', documentSlug: 'organisation' },
          { linkTitle: 'Nutzungsvertrag', documentNamespace: 'articles', documentSlug: 'nutzungsvertrag' },
          { linkTitle: 'Datenschutz', documentNamespace: 'articles', documentSlug: 'datenschutz' }
        ]
      }
    }, { upsert: true });
  }

  async down() {
    await this.db.collection('settings').deleteOne({ _id: 'helpPage' });
    await this.db.collection('settings').deleteOne({ _id: 'termsPage' });
    await this.db.collection('settings').deleteOne({ _id: 'footerLinks' });
  }
}

export default Migration2021011202;
