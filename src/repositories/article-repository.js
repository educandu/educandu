const Database = require('../database');

class ArticleRepository {
  static get inject() { return [Database]; }

  constructor(db) {
    this.articles = db.articles;
  }

  findLastArticles() {
    return this.articles.find({}, { limit: 10 }).toArray();
  }

  findArticleById(id) {
    return this.articles.findOne({ _id: id });
  }
}

module.exports = ArticleRepository;
