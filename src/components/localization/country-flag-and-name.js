import React from 'react';
import PropTypes from 'prop-types';

function CountryFlagAndName({ code, name, flagOnly }) {
  return (
    <span className="CountryFlagAndName">
      <span className={`flag-icon flag-icon-${code.toLowerCase()}`} title={name} />
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
