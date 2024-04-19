import { TAB } from './constants.js';
import React, { useEffect } from 'react';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';

function MaintenanceDocumentCategoriesTab() {
  const { t } = useTranslation('maintenanceDocumentCategoriesTab');

  useEffect(() => {
    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.documentCategories));
  }, []);

  return (
    <div className="MaintenanceDocumentCategoriesTab">
      {t('something')}
    </div>
  );
}

export default MaintenanceDocumentCategoriesTab;
