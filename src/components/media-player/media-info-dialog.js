import { Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import LicenseManager from '../../resources/license-manager.js';
import ResourceUrl from '../resource-selector/shared/resource-url.js';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';

export default function MediaInfoDialog({ mediaInfo, isOpen, onClose }) {
  const { t } = useTranslation('mediaInfoDialog');
  const licenseManager = useService(LicenseManager);

  const renderMissingData = () => <i>{t('common:missingDataPlaceholder')}</i>;

  const renderAllRightsReserved = () => <i>{t('common:allRightsReserved')}</i>;

  const renderLicenses = licenses => {
    const elements = [];

    for (let i = 0; i < licenses.length; i += 1) {
      const licenseKey = licenses[i];
      const foundLicense = licenseManager.getLicenseByKey(licenseKey);

      const licenseElement = foundLicense
        ? <a key={licenseKey} href={foundLicense.url} target='_blank' rel="noreferrer">{licenseKey}</a>
        : <span key={licenseKey}>{licenseKey}</span>;

      elements.push(licenseElement);

      if (i < licenses.length - 1) {
        elements.push(<Fragment key={`${licenseKey}-separator`}>, </Fragment>);
      }
    }

    return elements;
  };

  return (
    <Modal
      centered
      footer={null}
      open={isOpen}
      onCancel={onClose}
      title={t('title')}
      className='u-modal'
      >
      <div className="u-modal-body">
        {!!mediaInfo && (
          <Fragment>
            <div className="MediaInfoDialog-metadata">
              <div>
                <b>{t('common:name')}</b>
                <div>{mediaInfo.name}</div>
              </div>
              <div>
                <b>{t('common:shortDescription')}</b>
                <div>{mediaInfo.shortDescription || renderMissingData()}</div>
              </div>
              <div>
                <b>{t('common:licenses')}</b>
                <div>{mediaInfo.allRightsReserved ? renderAllRightsReserved() : renderLicenses(mediaInfo.licenses)}</div>
              </div>
            </div>
            <div className="MediaInfoDialog-url">
              <ResourceUrl url={mediaInfo.url} />
            </div>
          </Fragment>
        )}
      </div>
    </Modal>
  );
}

MediaInfoDialog.propTypes = {
  mediaInfo: mediaLibraryItemShape,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

MediaInfoDialog.defaultProps = {
  mediaInfo: null
};
