const React = require('react');
const PropTypes = require('prop-types');
const PageHeader = require('./../page-header.jsx');

function Docs({ initialState }) {
  return (
    <React.Fragment>
      <PageHeader />
      <div className="Section">
        <h1>Docs</h1>
        <ul>
          {initialState.map(doc => (
            <li key={doc._id}>
              <a href={`/docs/${doc._id}`}>{doc.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </React.Fragment>
  );
}

Docs.propTypes = {
  initialState: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })).isRequired
};

module.exports = Docs;
