const React = require('react');
const { Input } = require('antd');
const Page = require('../page.jsx');
const PageContent = require('../page-content.jsx');

const { Search } = Input;

const categories = ['Musikhochschule', 'Schule', 'Musikschule', 'Materialkiste'];

function goToDocs() {
  document.location = '/docs';
}

function Index() {
  const categoryElements = categories.map(category => {
    return (
      <div key={category} className="IndexPage-category">
        <a className="IndexPage-categoryLink" href="/docs">
          <img className="IndexPage-categoryImage u-img-color-flip" src={`/images/${category}.png`} />
        </a>
      </div>
    );
  });

  return (
    <Page fullScreen>
      <PageContent>
        <div className="IndexPage">
          <h1 className="IndexPage-title">elmu</h1>
          <div className="IndexPage-search">
            <Search
              placeholder="Suchbegriff"
              enterButton="Suchen"
              size="large"
              onSearch={goToDocs}
              />
          </div>
          <div className="IndexPage-categories">
            {categoryElements}
          </div>
        </div>
      </PageContent>
    </Page>
  );
}

module.exports = Index;
