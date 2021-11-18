import Page from '../page.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Button } from 'antd';

const logger = new Logger(import.meta.url);

function Import() {
  const { t } = useTranslation('import');

  const handleImportClick = () => {
    logger.info('Dummy import');
  };

  return (
    <Page>
      <div className="ImportPage">
        <h1>{t('pageNames:import')}</h1>
        <Button
          type="primary"
          onClick={handleImportClick}
          >
          {t('importButton')}
        </Button>
      </div>
    </Page>
  );
}

export default Import;
