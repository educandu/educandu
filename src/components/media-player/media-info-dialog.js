import { Modal } from 'antd';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import { useTranslation } from 'react-i18next';
import { useIsMounted } from '../../ui/hooks.js';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import LicenseManager from '../../resources/license-manager.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import EmptyState, { EMPTY_STATE_STATUS } from '../empty-state.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import ResourceUrl from '../resource-selector/shared/resource-url.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { getPortableUrl, isMediaLibrarySourceType } from '../../utils/source-utils.js';

const VIEW = {
  item: 'item',
  error: 'error',
  loading: 'loading',
  notAvailable: 'notAvailable'
};

const getCurrentViewFromItem = item => {
  if (item.error) {
    return VIEW.error;
  }
  if (item.isResolving) {
    return VIEW.loading;
  }
  if (item.resolvedItem) {
    return VIEW.item;
  }
  return VIEW.notAvailable;
};

const DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM = { canResolve: true, isResolving: true, resolvedItem: null, error: null };
const DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM = { canResolve: false, isResolving: false, resolvedItem: null, error: null };

export default function MediaInfoDialog({ sourceUrl, isOpen, onClose }) {
  const isMountedRef = useIsMounted();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mediaInfoDialog');
  const currentLoadingSourceUrlRef = useRef(null);
  const licenseManager = useService(LicenseManager);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [currentItem, setCurrentItem] = useState(DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isMediaLibrarySourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })) {
      const portableUrl = getPortableUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
      currentLoadingSourceUrlRef.current = portableUrl;
      setCurrentItem(DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM);
      (async () => {
        let error;
        let resolvedItem;
        try {
          error = null;
          resolvedItem = await mediaLibraryApiClient.findMediaLibraryItem({ url: portableUrl });
        } catch (err) {
          error = err;
          resolvedItem = null;
        }
        if (isMountedRef.current && currentLoadingSourceUrlRef.current === portableUrl) {
          setCurrentItem({ ...DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM, isResolving: false, resolvedItem, error });
        }
      })();
    } else {
      setCurrentItem(DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM);
    }
  }, [isOpen, sourceUrl, clientConfig.cdnRootUrl, mediaLibraryApiClient, isMountedRef]);

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

  const handleClose = () => {
    setCurrentItem(DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM);
  };

  const currentView = getCurrentViewFromItem(currentItem);

  return (
    <Modal
      centered
      footer={null}
      open={isOpen}
      onCancel={onClose}
      title={t('title')}
      className='u-modal'
      onClose={handleClose}
      >
      <div className="u-modal-body">
        <div className="MediaInfoDialog-body">
          {currentView === VIEW.error && (
            <EmptyState
              title={t('common:error')}
              subtitle={t('errorSubtitle')}
              status={EMPTY_STATE_STATUS.error}
              />
          )}
          {currentView === VIEW.loading && (
            <Spinner tip={t('loadingTip')} />
          )}
          {currentView === VIEW.notAvailable && (
            <EmptyState
              title={t('notAvailableTitle')}
              subtitle={t('notAvailableSubtitle')}
              status={EMPTY_STATE_STATUS.warning}
              />
          )}
          {currentView === VIEW.item && (
            <Fragment>
              <div className="MediaInfoDialog-itemMetadata">
                <div>
                  <b>{t('common:name')}</b>
                  <div>{currentItem.resolvedItem.name}</div>
                </div>
                <div>
                  <b>{t('common:shortDescription')}</b>
                  <div>{currentItem.resolvedItem.shortDescription || renderMissingData()}</div>
                </div>
                <div>
                  <b>{t('common:licenses')}</b>
                  <div>{currentItem.resolvedItem.allRightsReserved ? renderAllRightsReserved() : renderLicenses(currentItem.resolvedItem.licenses)}</div>
                </div>
              </div>
              <div className="MediaInfoDialog-itemUrl">
                <ResourceUrl url={currentItem.resolvedItem.url} />
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </Modal>
  );
}

MediaInfoDialog.propTypes = {
  sourceUrl: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

MediaInfoDialog.defaultProps = {
  sourceUrl: null
};
