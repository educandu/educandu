/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_04_15_01_add_consentText_to_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').insertOne({
      _id: 'consentText',
      value: {
        en: 'This website uses cookies that are technically needed for strictly functional aspects of the website. '
        + 'These cookies neither track your activities, nor provide 3-rd parties with information of any kind about your visit. '
        + 'By clicking accept you acknowledge this and give your express consent to the usage of the cookies.\n\n'
        + 'Users of our platform are able to embed external content via plugins such as a YouTube video player. '
        + 'By clicking on "accept" you will confirm that you have no objections to embedded external content.\n\n'
        + 'When saving text in a document or uploading files to our server, these will be published under the standard licence of this platform: CC BY-SA 4.0 or any later version (unless there is a different CC licence given in those files). '
        + 'By clicking on "accept" you will agree to these terms.',
        de: 'Diese Website verwendet technisch notwendige Cookies, um die Funktionalität der Website zu gewährleisten. '
        + 'Diese Cookies verfolgen weder Ihre Aktivitäten, noch liefern sie Dritten irgendwelche Informationen über Ihren Besuch. '
        + 'Indem Sie auf Akzeptieren klicken, bestätigen Sie dies und stimmen der Verwendung der Cookies ausdrücklich zu.\n\n'
        + 'Nutzer:innen dieser Seite können über Plugins externe Quellen wie z.B. einen YouTube-Videoplayer in Dokumente einbinden. '
        + 'Indem Sie auf Akzeptieren klicken, bestätigen Sie, gegen die Einbindung externer Quellen keine Einwände zu haben.\n\n'
        + 'Wenn Sie in Dokumenten Text speichern und Dateien auf den Server hochladen, werden diese – sofern in Dateien keine andere CC-Lizenz angegeben wird – unter der Standardlizenz dieser Plattform veröffentlicht: CC BY-SA 4.0 (any later version). '
        + 'Indem Sie auf Akzeptieren klicken, stimmen Sie dem zu.'
      }
    });
  }

  async down() {
    await this.db.collection('settings').deleteOne({ _id: 'consentText' });
  }
}
