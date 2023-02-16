import React from 'react';
import PropTypes from 'prop-types';
import { message, Tooltip } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import LiteralUrlLink from '../../literal-url-link.js';
import { useService } from '../../container-context.js';
import { handleError } from '../../../ui/error-helper.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import CopyToClipboardIcon from '../../icons/general/copy-to-clipboard-icon.js';

const logger = new Logger(import.meta.url);

function ResourceUrl({ url }) {
  const { t } = useTranslation();
  const clientConfig = useService(ClientConfig);
  const accessibleUrl = getAccessibleUrl({ url, cdnRootUrl: clientConfig.cdnRootUrl });

  const handleCopyUrlToClipboardClick = async event => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await window.navigator.clipboard.writeText(accessibleUrl);
      message.success(t('common:urlCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copyUrlToClipboardError'), error, logger, t, duration: 30 });
    }
  };

  return (
    <div className="ResourceUrl">
      <Tooltip title={t('common:copyUrlToClipboard')}>
        <a onClick={handleCopyUrlToClipboardClick}>
          <div className="ResourceUrl-icon"><CopyToClipboardIcon /></div>
        </a>
      </Tooltip>
      <LiteralUrlLink href={accessibleUrl} targetBlank />
    </div>
  );
}

ResourceUrl.propTypes = {
  url: PropTypes.string.isRequired
};

export default ResourceUrl;
