import { Select } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useService } from './container-context.js';
import LicenseManager from '../resources/license-manager.js';

function LicenseSelect({ multi, value, onChange, ...selectProps }) {
  const licenseManager = useService(LicenseManager);
  const licenseOptions = useMemo(() => {
    return licenseManager.getLicenses().map(l => ({ label: l.key, value: l.key }));
  }, [licenseManager]);

  const handleLicenseChange = keyOrKeys => {
    const allLicenses = licenseManager.getLicenses();
    const licenseOrLicenses = Array.isArray(keyOrKeys)
      ? keyOrKeys.map(key => allLicenses.find(license => license.key === key))
      : allLicenses.find(license => license.key === keyOrKeys);
    onChange(keyOrKeys, licenseOrLicenses);
  };

  return (
    <Select
      {...selectProps}
      options={licenseOptions}
      mode={multi ? 'multiple' : null}
      value={multi ? value || [] : value || null}
      onChange={handleLicenseChange}
      />
  );
}

LicenseSelect.propTypes = {
  multi: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  onChange: PropTypes.func
};

LicenseSelect.defaultProps = {
  multi: false,
  value: null,
  onChange: () => {}
};

export default LicenseSelect;
