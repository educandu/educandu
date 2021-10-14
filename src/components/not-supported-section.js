import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleFilled } from '@ant-design/icons';

function NotSupportedSection() {
  const { t } = useTranslation('notSupportedSection');

  return (
    <div className="NotSupportedSection">
      <div className="NotSupportedSection-icon"><ExclamationCircleFilled /></div>
      <div className="NotSupportedSection-title">{t('messageTitle')}</div>
    </div>
  );
}

export default NotSupportedSection;
