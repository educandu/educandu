import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BrowserNotSupported() {
  const { t } = useTranslation('browserNotSupported');
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {t('mainText')}
    </div>
  );
}
