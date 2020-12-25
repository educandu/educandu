const React = require('react');
const PropTypes = require('prop-types');
const { withData } = require('./data-context');
const { dataProps } = require('../ui/default-prop-types');

function CountryFlagAndName({ code, data }) {
  const name = (data && data['country-names'] && data['country-names'][code]) || code;
  return (
    <span className="CountryFlagAndName">
      <span className={`flag-icon flag-icon-${code.toLowerCase()}`} />
      &nbsp;&nbsp;
      <span>{name}</span>
    </span>
  );
}

CountryFlagAndName.propTypes = {
  ...dataProps,
  code: PropTypes.string.isRequired
};

module.exports = withData(CountryFlagAndName);
