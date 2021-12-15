import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function CountryFlagAndName({ code, name, flagOnly, stacked }) {
  const classes = classNames({
    'CountryFlagAndName': true,
    'CountryFlagAndName--stacked': stacked
  });

  return (
    <span className={classes}>
      <span className={`CountryFlagAndName-flag flag-icon flag-icon-${code.toLowerCase()}`} title={name} />
      {!flagOnly && <span className="CountryFlagAndName-name">&nbsp;&nbsp;{name}</span>}
    </span>
  );
}

CountryFlagAndName.propTypes = {
  code: PropTypes.string.isRequired,
  flagOnly: PropTypes.bool,
  name: PropTypes.string.isRequired,
  stacked: PropTypes.bool
};

CountryFlagAndName.defaultProps = {
  flagOnly: false,
  stacked: false
};

export default CountryFlagAndName;
