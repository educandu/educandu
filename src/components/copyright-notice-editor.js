import { Spin } from 'antd';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useIsMounted } from '../ui/hooks.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import { useService } from './container-context.js';
import { SOURCE_TYPE } from '../domain/constants.js';
import { handleApiError } from '../ui/error-helper.js';
import ClientConfig from '../bootstrap/client-config.js';
import React, { useEffect, useRef, useState } from 'react';
import LicenseManager from '../resources/license-manager.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { getWikimediaPageFromUrl } from '../utils/wikimedia-utils.js';
import { getPortableUrl, getSourceType } from '../utils/source-utils.js';
import MediaLibraryApiClient from '../api-clients/media-library-api-client.js';

const logger = new Logger(import.meta.url);

function CopyrightNoticeEditor({ value, sourceUrl, debounced, onChange }) {
  const isMountedRef = useIsMounted();
  const handleChangeRef = useRef(null);
  const handleApiErrorRef = useRef(null);
  const clientConfig = useService(ClientConfig);
  const initialSourceUrlRef = useRef(sourceUrl);
  const licenseManager = useService(LicenseManager);
  const [isLoading, setIsLoading] = useState(false);
  const currentLoadingCanonicalUrlRef = useRef(null);
  const { t } = useTranslation('copyrightNoticeEditor');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  handleChangeRef.current = ({ canonicalUrl, sourceType, mediaLibraryItem }) => {
    let newValue;
    if (canonicalUrl && sourceType === SOURCE_TYPE.youtube) {
      newValue = t('youtubeCopyrightNotice', { link: canonicalUrl });
    } else if (canonicalUrl && sourceType === SOURCE_TYPE.wikimedia) {
      newValue = t('wikimediaCopyrightNotice', { link: getWikimediaPageFromUrl(canonicalUrl) });
    } else if (canonicalUrl && sourceType === SOURCE_TYPE.mediaLibrary && mediaLibraryItem) {
      const licenseLabel = mediaLibraryItem.licenses.length > 1 ? t('common:licenses') : t('common:license');
      const licensesValue = mediaLibraryItem.licenses.map(licenseKey => {
        const foundLicense = licenseManager.getLicenseByKey(licenseKey);
        return foundLicense ? `[${licenseKey}](${encodeURI(foundLicense.url)})` : licenseKey;
      }).join(', ');
      newValue = mediaLibraryItem.shortDescription
        ? `${mediaLibraryItem.shortDescription}\n\n${licenseLabel}: ${licensesValue}`
        : `${licenseLabel}: ${licensesValue}`;
    } else {
      newValue = '';
    }

    onChange(newValue);
  };

  handleApiErrorRef.current = error => {
    handleApiError({ error, logger, t });
  };

  useEffect(() => {
    if (sourceUrl === initialSourceUrlRef.current) {
      return;
    }

    const sourceType = getSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const canonicalUrl = getPortableUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    handleChangeRef.current({ canonicalUrl, sourceType, mediaLibraryItem: null });

    if (sourceType === SOURCE_TYPE.mediaLibrary) {
      currentLoadingCanonicalUrlRef.current = canonicalUrl;
      setIsLoading(true);
      (async () => {
        let error;
        let mediaLibraryItem;
        try {
          error = null;
          mediaLibraryItem = await mediaLibraryApiClient.findMediaLibraryItem({ url: canonicalUrl });
        } catch (err) {
          error = err;
          mediaLibraryItem = null;
        }

        if (!isMountedRef.current) {
          return;
        }

        if (currentLoadingCanonicalUrlRef.current === canonicalUrl) {
          setIsLoading(false);
          currentLoadingCanonicalUrlRef.current = null;

          if (mediaLibraryItem) {
            handleChangeRef.current({ canonicalUrl, sourceType, mediaLibraryItem });
          }

          if (error) {
            handleApiErrorRef.current(error);
          }
        }
      })();
    } else {
      currentLoadingCanonicalUrlRef.current = null;
      setIsLoading(false);
    }
  }, [sourceUrl, clientConfig.cdnRootUrl, mediaLibraryApiClient, isMountedRef]);

  const handleValueChange = event => {
    onChange(event.target.value);
  };

  return (
    <Spin spinning={isLoading}>
      <MarkdownInput value={value} debounced={debounced} onChange={handleValueChange} />
    </Spin>
  );
}

CopyrightNoticeEditor.propTypes = {
  value: PropTypes.string,
  sourceUrl: PropTypes.string,
  debounced: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

CopyrightNoticeEditor.defaultProps = {
  value: null,
  sourceUrl: null,
  debounced: false
};

export default CopyrightNoticeEditor;
