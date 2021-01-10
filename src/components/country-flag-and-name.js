import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context';
import { useLanguage } from './language-context';
import CountryNameProvider from '../data/country-name-provider';

function CountryFlagAndName({ code }) {
  const { language } = useLanguage();
  const countryNameProvider = useService(CountryNameProvider);
  const data = countryNameProvider.getData(language);
  const name = data[code] || code;
  return (
    <span className="CountryFlagAndName">
      <span className={`flag-icon flag-icon-${code.toLowerCase()}`} />
      &nbsp;&nbsp;
      <span>{name}</span>
    </span>
  );
}

CountryFlagAndName.propTypes = {
  code: PropTypes.string.isRequired
};

export default CountryFlagAndName;
