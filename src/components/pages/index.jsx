const React = require('react');
const PageHeader = require('./../page-header.jsx');

function Index() {
  return (
    <React.Fragment>
      <PageHeader />
      <div className="Section">
        <h1>Index</h1>
        <p>Go to the <a href="/docs">documents</a>!</p>
      </div>
    </React.Fragment>
  );
}

module.exports = Index;
