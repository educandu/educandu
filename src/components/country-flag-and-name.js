import React from 'react';
import PropTypes from 'prop-types';
import { withData } from './data-context';
import { dataProps } from '../ui/default-prop-types';

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

export default withData(CountryFlagAndName);
