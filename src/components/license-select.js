import { Select } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import LicenseManager from '../resources/license-manager.js';

export const ALL_RIGHTS_RESERVED_KEY = 'all-rights-reserved';

function LicenseSelect({ multi, value, includeAllRightsReserved, onChange, ...selectProps }) {
  const { t } = useTranslation();
  const licenseManager = useService(LicenseManager);
  const licenseOptions = useMemo(() => {
    const opts = licenseManager.getLicenses().map(l => ({ label: l.key, value: l.key }));
    return includeAllRightsReserved ? [{ label: `(${t('common:allRightsReserved')})`, value: ALL_RIGHTS_RESERVED_KEY }, ...opts] : opts;
  }, [licenseManager, includeAllRightsReserved, t]);

  const handleLicenseChange = keyOrKeys => {
    let licenseOrLicenses = null;
    let allRightsReserved = false;

    if (Array.isArray(keyOrKeys)) {
      licenseOrLicenses = [];
      for (const key of keyOrKeys) {
        if (key === ALL_RIGHTS_RESERVED_KEY) {
          allRightsReserved = true;
        } else {
          licenseOrLicenses.push(licenseManager.getLicenseByKey(key));
        }
      }
    } else if (keyOrKeys === ALL_RIGHTS_RESERVED_KEY) {
      allRightsReserved = true;
    } else {
      licenseOrLicenses = licenseManager.getLicenseByKey(keyOrKeys);
    }

    onChange(keyOrKeys ?? null, licenseOrLicenses, allRightsReserved);
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
  includeAllRightsReserved: PropTypes.bool,
  onChange: PropTypes.func
};

LicenseSelect.defaultProps = {
  multi: false,
  value: null,
  includeAllRightsReserved: false,
  onChange: () => {}
};

export default LicenseSelect;
