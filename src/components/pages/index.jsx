const React = require('react');
const { Input } = require('antd');

const { Search } = Input;

function goToDocs() {
  document.location = '/docs';
}

function Index() {
  return (
    <main className="IndexPage">
      <div className="IndexPage-content">
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
          <div className="IndexPage-category">
            <a className="IndexPage-categoryLink" href="/docs">
              <img className="IndexPage-categoryImage u-img-color-flip" src="/images/Musikhochschule.png" />
            </a>
          </div>
          <div className="IndexPage-category">
            <a className="IndexPage-categoryLink" href="/docs">
              <img className="IndexPage-categoryImage u-img-color-flip" src="/images/Schule.png" />
            </a>
          </div>
          <div className="IndexPage-category">
            <a className="IndexPage-categoryLink" href="/docs">
              <img className="IndexPage-categoryImage u-img-color-flip" src="/images/Musikschule.png" />
            </a>
          </div>
          <div className="IndexPage-category">
            <a className="IndexPage-categoryLink" href="/docs">
              <img className="IndexPage-categoryImage u-img-color-flip" src="/images/Materialkiste.png" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

module.exports = Index;
