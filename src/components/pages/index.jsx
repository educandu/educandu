const React = require('react');
const Page = require('../page.jsx');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const DocView = require('../doc-view.jsx');
const ElmuLogo = require('../elmu-logo.jsx');
const Restricted = require('../restricted.jsx');
const permissions = require('../../domain/permissions');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

const { Search } = Input;

function handleSearchClick() {
  Modal.error({
    title: 'Leider, leider ...',
    content: '... ist ELMU noch nicht so weit, dass Sie hier komfortabel suchen können. Wir arbeiten daran ...'
  });
}

function handleGoToDocumentsClick() {
  document.location = urls.getDocsUrl();
}

function handleGoToMenusClick() {
  document.location = urls.getMenusUrl();
}

function handleGoToUsersClick() {
  document.location = urls.getUsersUrl();
}

function handleGoToSettingsClick() {
  document.location = urls.getSettingsUrl();
}

function Index({ initialState, language }) {
  const { doc, sections } = initialState;

  const headerContent = (
    <aside>
      <Restricted to={permissions.EDIT_DOC}>
        <Button type="primary" onClick={handleGoToDocumentsClick}>Dokumente</Button>
      </Restricted>
      &nbsp;
      <Restricted to={permissions.EDIT_MENU}>
        <Button type="primary" onClick={handleGoToMenusClick}>Menüs</Button>
      </Restricted>
      &nbsp;
      <Restricted to={permissions.EDIT_USERS}>
        <Button type="primary" onClick={handleGoToUsersClick}>Benutzer</Button>
      </Restricted>
      &nbsp;
      <Restricted to={permissions.EDIT_SETTINGS}>
        <Button type="primary" onClick={handleGoToSettingsClick}>Einstellungen</Button>
      </Restricted>
    </aside>
  );

  /* eslint-ignore-next-line capitalized-comments */
  // const footer = (
  //   <div>
  //     <Button
  //       className="IndexPage-helpButton"
  //       size="large"
  //       icon="question-circle"
  //       href={urls.getArticleUrl('hilfe')}
  //       >
  //       Hilfe
  //     </Button>
  //   </div>
  // );

  return (
    <Page headerContent={headerContent} fullScreen>
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
