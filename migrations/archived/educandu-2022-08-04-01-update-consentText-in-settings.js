export default class Educandu_2022_08_04_01_update_consentText_in_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').updateOne(
      { _id: 'consentText' },
      {
        $set: {
          value: {
            en: 'This website uses cookies that are technically needed for strictly functional aspects of the website. '
        + 'These cookies neither track your activities, nor provide 3-rd parties with information of any kind about your visit. '
        + 'By clicking accept you acknowledge this and give your express consent to the usage of the cookies.\n\n'
        + 'Users of our platform are able to embed external content via plugins such as a YouTube video player. '
        + 'By clicking on "accept" you will confirm that you have no objections to embedded external content.\n\n'
        + 'When saving text in a document or uploading files to our server, these will be published under the standard licence of this platform: CC BY-SA 4.0 or any later version (unless there is a different CC licence given in those files). '
        + 'By clicking on "accept" you will agree to these terms.',
            de: 'Diese Website verwendet technisch notwendige Cookies, um die Funktionalität der Website zu gewährleisten. '
        + 'Diese Cookies verfolgen weder deine Aktivitäten, noch liefern sie Dritten irgendwelche Informationen über deinen Besuch. '
        + 'Indem du auf Akzeptieren klickst, bestätigst du dies und stimmst der Verwendung der Cookies ausdrücklich zu.\n\n'
        + 'Nutzer:innen dieser Seite können über Plugins externe Quellen wie z.B. einen YouTube-Videoplayer in Dokumente einbinden. '
        + 'Indem du auf Akzeptieren klickst, bestätigst du, gegen die Einbindung externer Quellen keine Einwände zu haben.\n\n'
        + 'Wenn du in Dokumenten Text speicherst und Dateien auf den Server hochlädst, werden diese – sofern in Dateien keine andere CC-Lizenz angegeben wird – unter der Standardlizenz dieser Plattform veröffentlicht: CC BY-SA 4.0 (any later version). '
        + 'Indem du auf Akzeptieren klickst, stimmst du dem zu.'
          }
        }
      }
    );
  }

  down() {
    throw new Error('Not implemented');
  }
}
