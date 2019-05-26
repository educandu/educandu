const React = require('react');
const Page = require('../page.jsx');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Restricted = require('../restricted.jsx');
const PageFooter = require('../page-footer.jsx');
const LoginLogout = require('../login-logout.jsx');
const PageContent = require('../page-content.jsx');
const permissions = require('../../domain/permissions');

const { Search } = Input;

const categories = ['Musikhochschule', 'Schule', 'Musikschule', 'Materialkiste'];

function showNotImplementedNotification() {
  Modal.error({
    title: 'Leider, leider ...',
    content: '... ist ELMU noch nicht so weit, dass Sie hier komfortabel suchen können. Wir arbeiten daran ...'
  });
}

function handleNewDocumentClick() {
  document.location = urls.getDocsUrl();
}

function Index() {
  const categoryElements = categories.map(category => {
    return (
      <div key={category} className="IndexPage-category">
        <a className="IndexPage-categoryLink" href={urls.getMenuUrl(category.toLowerCase())}>
          <img className="IndexPage-categoryImage u-img-color-flip" src={`/images/${category}.png`} />
        </a>
      </div>
    );
  });

  return (
    <Page fullScreen>
      <Restricted to={permissions.EDIT_DOC}>
        <Button className="IndexPage-docsButton" type="primary" onClick={handleNewDocumentClick}>Zu den Dokumenten</Button>
      </Restricted>
      <PageContent fullScreen>
        <div className="IndexPage">
          <aside className="IndexPage-loginLogout">
            <LoginLogout />
          </aside>
          <h1 className="IndexPage-title">elmu</h1>
          <div className="IndexPage-search">
            <Search
              placeholder="Suchbegriff"
              enterButton="Suchen"
              size="large"
              onSearch={showNotImplementedNotification}
              />
          </div>
          <div className="IndexPage-categories">
            {categoryElements}
          </div>
        </div>
      </PageContent>
      <PageFooter fullScreen>
        <Button
          className="IndexPage-helpButton"
          size="large"
          icon="question-circle"
          href={urls.getArticleUrl('hilfe')}
          >
          Hilfe
        </Button>
      </PageFooter>
    </Page>
  );
}

module.exports = Index;
