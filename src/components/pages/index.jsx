const React = require('react');
const { Input } = require('antd');
const PageHeader = require('../page-header.jsx');
const HoverImage = require('../hover-image.jsx');

const { Search } = Input;

const categories = [
  {
    key: 'Musikhochschule',
    src: '/images/Musikhochschule-grau.png',
    hoverSrc: '/images/Musikhochschule-farbig.png'
  },
  {
    key: 'Schule',
    src: '/images/Schule-grau.png',
    hoverSrc: '/images/Schule-farbig.png'
  },
  {
    key: 'Musikschule',
    src: '/images/Musikschule-grau.png',
    hoverSrc: '/images/Musikschule-farbig.png'
  },
  {
    key: 'Materialkiste',
    src: '/images/Materialkiste-grau.png',
    hoverSrc: '/images/Materialkiste-farbig.png'
  }
];

function goToDocs() {
  document.location = '/docs';
}

function Index() {
  const categoryElements = categories.map(img => {
    return (
      <div key={img.key} className="IndexPage-category">
        <a className="IndexPage-categoryLink" href="/docs">
          <HoverImage
            imageClass="IndexPage-categoryImage"
            src={img.src}
            hoverSrc={img.hoverSrc}
            />
        </a>
      </div>
    );
  });

  return (
    <React.Fragment>
      <PageHeader />
      <div className="PageContent">
        <main className="IndexPage">
          <div className="IndexPage-content">
            <h1 className="IndexPage-title">elmu.online</h1>
            <div className="IndexPage-search">
              <Search
                placeholder="Geben Sie einen Suchbegriff ein"
                enterButton="Suchen"
                size="large"
                onSearch={goToDocs}
                />
            </div>
            <div className="IndexPage-categories">
              {categoryElements}
            </div>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
}

module.exports = Index;
