import React from 'react';
import PropTypes from 'prop-types';

function countryCodeToFlagEmoji(country) {
  return String.fromCodePoint(...[...country].map(c => c.charCodeAt() + 0x1F1A5));
}

function CountryFlagAndName({ code, name, flagOnly }) {
  return (
    <span className="CountryFlagAndName">
      <span>{countryCodeToFlagEmoji(code)}</span>
      {!flagOnly && <span>&nbsp;&nbsp;{name}</span>}
    </span>
  );
}

CountryFlagAndName.propTypes = {
  code: PropTypes.string.isRequired,
  flagOnly: PropTypes.bool,
  name: PropTypes.string.isRequired
};

CountryFlagAndName.defaultProps = {
  flagOnly: false
};

export default CountryFlagAndName;
