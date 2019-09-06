const React = require('react');
const Page = require('../page.jsx');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const DocView = require('../doc-view.jsx');
const ElmuLogo = require('../elmu-logo.jsx');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

const { Search } = Input;

function handleSearchClick() {
  Modal.error({
    title: 'Leider, leider ...',
    content: '... ist ELMU noch nicht so weit, dass Sie hier komfortabel suchen können. Wir arbeiten daran ...'
  });
}

function Index({ initialState, language }) {
  const { doc, sections } = initialState;

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="IndexPage-search">
          <Search
            placeholder="Suchbegriff"
            enterButton="Suchen"
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
