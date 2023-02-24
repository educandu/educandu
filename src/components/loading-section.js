import React from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

function LoadingSection() {
  const { t } = useTranslation('loadingSection');

  return (
    <div className="LoadingSection">
      <Spin tip={t('messageTitle')} size="large" />
    </div>
  );
}

export default LoadingSection;
