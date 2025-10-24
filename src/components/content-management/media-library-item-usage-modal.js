import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import slugify from '@sindresorhus/slugify';
import { Modal, Spin, Tooltip } from 'antd';
import { ExternalLinkIcon } from '../icons/icons.js';
import { Trans, useTranslation } from 'react-i18next';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { getResourceIconByResourceType, getResourceType } from '../../utils/resource-utils.js';

function MediaLibraryItemUsageModal({ mediaLibraryItemName, isOpen, onClose }) {
  const [usage, setUsage] = useState(null);
  const displayedMediaLibraryItemName = useRef(null);
  const { t } = useTranslation('mediaLibraryItemUsageModal');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  displayedMediaLibraryItemName.current = isOpen ? mediaLibraryItemName : null;

  useEffect(() => {
    if (!isOpen || !mediaLibraryItemName) {
      setUsage(null);
      return;
    }

    (async () => {
      const newUsage = await mediaLibraryApiClient.getMediaLibraryItemUsage({ mediaLibraryItemName });
      if (mediaLibraryItemName === displayedMediaLibraryItemName.current) {
        setUsage(newUsage);
      }
    })();
    setUsage(null);
  }, [mediaLibraryItemName, isOpen, mediaLibraryApiClient]);

  const renderNotUsed = () => {
    return (
      <div className="MediaLibraryItemUsageModal-usage MediaLibraryItemUsageModal-usage--none">
        {t('notUsed')}
      </div>
    );
  };

  const renderPublicUsages = links => {
    if (!links.length) {
      return renderNotUsed();
    }

    return (
      <Fragment>
        {links.map(link => (
          <div
            key={link.key}
            className="MediaLibraryItemUsageModal-usage MediaLibraryItemUsageModal-usage--link"
            >
            <ExternalLinkIcon />
            &nbsp;
            <a
              title={link.text}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              >
              {link.text}
            </a>
          </div>
        ))}
      </Fragment>
    );
  };

  const renderDocuments = documents => renderPublicUsages(documents.map(document => ({
    key: document._id,
    href: routes.getDocUrl({ id: document._id, slug: document.slug }),
    text: document.title
  })));

  const renderFirstAffectedRevisions = documents => renderPublicUsages(documents.map(document => ({
    key: document._id,
    href: routes.getDocumentRevisionUrl(document.firstAffectedRevisionId),
    text: document.title
  })));

  const renderDocumentCategories = categories => renderPublicUsages(categories.map(category => ({
    key: category._id,
    href: routes.getDocumentCategoryUrl({ id: category._id, slug: slugify(category.name) }),
    text: category.name
  })));

  const renderUsers = users => renderPublicUsages(users.map(user => ({
    key: user._id,
    href: routes.getUserProfileUrl(user._id),
    text: user.displayName
  })));

  const renderSettingCount = settingCount => {
    if (!settingCount) {
      return renderNotUsed();
    }

    return (
      <div className="MediaLibraryItemUsageModal-usage">
        <Trans
          t={t}
          i18nKey="settingsUsageDetails"
          values={{ count: settingCount }}
          components={[<b key="bold" />]}
          />
      </div>
    );
  };

  const renderPrivateUsage = privateUsage => {
    if (!privateUsage.roomContentCount && !privateUsage.roomDocumentCount && !privateUsage.roomCount) {
      return renderNotUsed();
    }

    return (
      <div className="MediaLibraryItemUsageModal-usage">
        <Trans
          t={t}
          i18nKey="privateUsageDetails"
          values={privateUsage}
          components={[<b key="bold" />]}
          />
      </div>
    );
  };

  const renderItemName = () => {
    if (!mediaLibraryItemName) {
      return null;
    }

    const resourceType = getResourceType(mediaLibraryItemName);
    const Icon = getResourceIconByResourceType({ resourceType });
    return (
      <div className="MediaLibraryItemUsageModal-itemName">
        <Icon />
        &nbsp;
        {mediaLibraryItemName}
      </div>
    );
  };

  const renderSubtitle = (text, tooltipText = null) => {
    return (
      <div className="MediaLibraryItemUsageModal-sectionSubtitle">
        {text}
        {!!tooltipText && (
          <Fragment>
            &nbsp;&nbsp;
            <Tooltip title={tooltipText}>
              <QuestionCircleOutlined className="MediaLibraryItemUsageModal-infoIcon" />
            </Tooltip>
          </Fragment>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={t('title')}
      className="u-modal"
      width="800px"
      open={isOpen}
      onClose={onClose}
      onCancel={onClose}
      footer={null}
      closable
      >
      <div className="MediaLibraryItemUsageModal u-modal-body">
        {renderItemName()}
        {!!usage && (
          <Fragment>
            <div className="MediaLibraryItemUsageModal-sectionTitle">{t('publicUsage')}</div>
            {renderSubtitle(t('nonArchivedDocuments'), t('nonArchivedDocumentsTooltip'))}
            {renderDocuments(usage.publicUsage.nonArchivedDocuments)}
            {renderSubtitle(t('nonArchivedDocumentsWithHistory'), t('nonArchivedDocumentsWithHistoryTooltip'))}
            {renderFirstAffectedRevisions(usage.publicUsage.nonArchivedDocumentsWithHistory)}
            {renderSubtitle(t('archivedDocumentsWithHistory'), t('archivedDocumentsWithHistoryTooltip'))}
            {renderDocuments(usage.publicUsage.archivedDocumentsWithHistory)}
            {renderSubtitle(t('documentCategories'))}
            {renderDocumentCategories(usage.publicUsage.documentCategories)}
            {renderSubtitle(t('users'))}
            {renderUsers(usage.publicUsage.users)}
            {renderSubtitle(t('settings'))}
            {renderSettingCount(usage.publicUsage.settingCount)}
            <div className="MediaLibraryItemUsageModal-sectionTitle">{t('privateUsage')}</div>
            {renderPrivateUsage(usage.privateUsage)}
          </Fragment>
        )}
        {!usage && (
          <div className="MediaLibraryItemUsageModal-spinner">
            <Spin size="large">&nbsp;</Spin>
          </div>
        )}
      </div>
    </Modal>
  );
}

MediaLibraryItemUsageModal.propTypes = {
  mediaLibraryItemName: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

MediaLibraryItemUsageModal.defaultProps = {
  mediaLibraryItemName: null
};

export default MediaLibraryItemUsageModal;
