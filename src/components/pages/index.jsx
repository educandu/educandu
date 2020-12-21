const React = require('react');
const { Input } = require('antd');
const Page = require('../page.jsx');
const PropTypes = require('prop-types');
const DocView = require('../doc-view.jsx');
const ElmuLogo = require('../elmu-logo.jsx');
const { useRequest } = require('../request-context.jsx');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

const { Search } = Input;

function Index({ initialState, language }) {
  const rq = useRequest();
  const { doc, sections } = initialState;

  const handleSearchClick = searchTerm => {
    const googleTerm = [`site:${rq.hostInfo.host}`, searchTerm].filter(x => x).join(' ');
    const link = `https://www.google.com/search?q=${encodeURIComponent(googleTerm)}`;
    window.open(link, '_blank');
  };

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="IndexPage-search">
          <Search
            placeholder="Suchbegriff"
            enterButton="Suchen mit Google"
            size="large"
            onSearch={handleSearchClick}
            />
        </div>
        {doc && sections && <DocView doc={doc} sections={sections} language={language} />}
      </div>
    </Page>
  );
}

Index.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};


module.exports = Index;
