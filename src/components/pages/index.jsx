const React = require('react');
const Page = require('../page.jsx');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const urls = require('../../utils/urls');
const PageFooter = require('../page-footer.jsx');
const LoginLogout = require('../login-logout.jsx');
const PageContent = require('../page-content.jsx');

const { Search } = Input;

const categories = ['Musikhochschule', 'Schule', 'Musikschule', 'Materialkiste'];

function showNotImplementedNotification() {
  Modal.error({
    title: 'Leider, leider ...',
    content: '... steckt ELMU noch in den Kinderschuhen. Wir arbeiten daran ...'
  });
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
      <PageContent fullScreen>
        <div className="IndexPage">
          <aside className="IndexPage-logo" />
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
      <PageFooter fullScreen />
    </Page>
  );
}

module.exports = Index;
