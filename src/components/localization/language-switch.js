import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

function LanguageSwitch() {
  const { i18n } = useTranslation();

  return (
    <div className="LanguageSwitch">
      <Button type="link" onClick={() => i18n.changeLanguage('de')}>
        <span className="flag-icon flag-icon-de" />
      </Button>
      /
      <Button type="link" onClick={() => i18n.changeLanguage('en')}>
        <span className="flag-icon flag-icon-us" />
      </Button>
    </div>
  );
}

LanguageSwitch.propTypes = {};

export default LanguageSwitch;
