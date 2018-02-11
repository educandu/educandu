const fakeArticle = {
  sections: [
    {
      id: 'fgsw35gv5',
      type: 'markdown',
      content: `# Die Überleitung
## von Ulrich Kaiser
Mit dem Begriff Überleitung wird eine bestimmte Formfunktion in Sonatensätzen bezeichnet. Das folgende Diagramm zeigt die Formfunktionen der Sonatenhauptsatzform, die sich zur Analyse von Sonaten und Sinfonien etabliert hat:
Sonatensätze, die sich angemessen über die Sonatenhauptsatzform verstehen lassen, beginnen mit der Formfuntkion Hauptsatz (auch 1. Thema). Dem Hauptsatz schließt sich die Formfunktion Überleitung an, das heißt, die Überleitung hat den Charakter einer 2. Taktgruppe im Rahmen der Sonatenhauptsatzform. Die Überleitung verbindet den Hauptsatz mit der dritten Formfunktion, dem Seitensatz, der in der Exposition in einer Nebentonart erklingt (in Dur meist die Tonart der V. Stufe, in Moll in der Regel die Tonart der iii. Stufe). Da die Überleitung in der Reprise wegen unterschiedlichen tonartlichen Verhältnisse ín der Reprise nicht selten stark von der Gestaltung in der Exposition abweicht, beschränkt sich dieses Tutorial auf einige Überleitungstypen in Expositionen.
Bitte haben Sie einen Moment Geduld, hier geht es in Kürze weiter...`
    }
  ]
};

class ArticleRepository {
  findArticleById() {
    return Promise.resolve(fakeArticle);
  }
}

module.exports = ArticleRepository;
