const express = require('express');

const settings = {
  port: 3000
};

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/static`));

app.get('/', (req, res) => {
  res.render('index', { title: 'The index page!' });
});

app.listen(settings.port, err => {
  if (err) {
    /* eslint no-console: off */
    console.error(err);
  } else {
    console.log(`Example app listening on port ${settings.port}`);
  }
});
