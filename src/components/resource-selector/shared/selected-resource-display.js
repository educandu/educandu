import React from 'react';
import PropTypes from 'prop-types';
import { message, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import Logger from '../../../common/logger.js';
import { LinkOutlined } from '@ant-design/icons';
import ResourcePreview from './resource-preview.js';
import BreakIntoWords from '../../break-into-words.js';
import { useService } from '../../container-context.js';
import { handleError } from '../../../ui/error-helper.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import { browserFileType } from '../../../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

function SelectedResourceDisplay({ urlOrFile, actions, footer }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('selectedResourceDisplay');

  const isUrl = typeof urlOrFile === 'string';
  const isFile = urlOrFile instanceof File;

  let subtitle;
  if (isUrl) {
    subtitle = urlOrFile;
  } else if (isFile) {
    subtitle = urlOrFile.name;
  } else {
    subtitle = null;
  }

  const handleCopyToClipboardClick = async () => {
    const accessibleUrl = getAccessibleUrl({ url: urlOrFile, cdnRootUrl: clientConfig.cdnRootUrl });

    try {
      await window.navigator.clipboard.writeText(accessibleUrl);
      message.success(t('common:urlCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copyUrlToClipboardError'), error, logger, t, duration: 30 });
    }
  };

  return (
    <div className="SelectedResourceDisplay">
      <div>
        <div className="SelectedResourceDisplay-title">{t('currentlySelectedFile')}:</div>
        {!!subtitle && (
          <div className="SelectedResourceDisplay-subtitleWrapper">
            {!!isUrl && (
              <Tooltip title={t('common:copyUrlToClipboard')}>
                <LinkOutlined onClick={handleCopyToClipboardClick} />
              </Tooltip>
            )}
            <div className="SelectedResourceDisplay-subtitle"><BreakIntoWords>{subtitle}</BreakIntoWords></div>
          </div>
        )}
      </div>
      <ResourcePreview urlOrFile={urlOrFile} />
      {!!actions && <div className="SelectedResourceDisplay-actions">{actions}</div>}
      {!!footer && <div className="SelectedResourceDisplay-footer">{footer}</div>}
    </div>
  );
}

SelectedResourceDisplay.propTypes = {
  urlOrFile: PropTypes.oneOfType([
    PropTypes.string,
    browserFileType
  ]).isRequired,
  actions: PropTypes.node,
  footer: PropTypes.node
};

SelectedResourceDisplay.defaultProps = {
  actions: null,
  footer: null
};

export default SelectedResourceDisplay;
