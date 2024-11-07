import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import DocumentCard from '../document-card.js';
import { PlusOutlined } from '@ant-design/icons';
import FavoriteToggle from '../favorite-toggle.js';
import { ContactUserIcon } from '../icons/icons.js';
import { useService } from '../container-context.js';
import { useDateFormat } from '../locale-context.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { publicUserShape } from '../../ui/default-prop-types.js';
import { Avatar, Button, Form, Input, Modal, Tooltip } from 'antd';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import { useDebouncedFetchingState, useGetCurrentUrl } from '../../ui/hooks.js';
import { AVATAR_SIZE_BIG, CONTACT_REQUEST_EXPIRATION_IN_DAYS, FAVORITE_TYPE } from '../../domain/constants.js';

const DOCUMENTS_BATCH_SIZE = 8;

export default function UserProfile({ PageTemplate, initialState }) {
  const { user } = initialState;
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('userProfile');
  const userApiClient = useService(UserApiClient);
  const documentApiClient = useService(DocumentApiClient);

  const viewingUser = useUser();
  const getCurrentUrl = useGetCurrentUrl();
  const contactRequestFormRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [fetchingDocuments, setFetchingDocuments] = useDebouncedFetchingState(true);
  const [isContactRequestModalOpen, setIsContactRequestModalOpen] = useState(false);
  const [isSendingUserContactRequest, setIsSendingUserContactRequest] = useState(false);
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(DOCUMENTS_BATCH_SIZE);
  const [contactRequestSentOn, setContactRequestSentOn] = useState(initialState.contactRequestSentOn);

  const contactEmailAddressValidationRules = [
    {
      required: true,
      message: t('common:enterEmail'),
      whitespace: true
    },
    {
      type: 'email',
      message: t('common:emailIsInvalid')
    }
  ];

  useEffect(() => {
    (async () => {
      setFetchingDocuments(true);
      const documentApiClientResponse = await documentApiClient.getPublicNonArchivedDocumentsByContributingUser({ userId: user._id, createdOnly: true });
      setFetchingDocuments(false);
      setDocuments(documentApiClientResponse.documents);
    })();
  }, [user, setFetchingDocuments, documentApiClient]);

  const handleMoreDocumentsClick = () => {
    setVisibleDocumentsCount(visibleDocumentsCount + DOCUMENTS_BATCH_SIZE);
  };

  const handleContactRequestModalOk = () => {
    if (contactRequestFormRef.current) {
      contactRequestFormRef.current.submit();
    }
  };

  const handleContactRequestFormFinish = async ({ contactEmailAddress }) => {
    setIsSendingUserContactRequest(true);

    const response = await userApiClient.postContactRequest({ toUserId: user._id, contactEmailAddress });
    setContactRequestSentOn(response.contactRequestSentOn);

    setIsContactRequestModalOpen(false);
    setIsSendingUserContactRequest(false);
  };

  const handleContactRequestModalCancel = () => {
    setIsContactRequestModalOpen(false);
  };

  const handleContactUserClick = () => {
    if (!viewingUser) {
      window.location = routes.getLoginUrl({ currentUrl: getCurrentUrl() });
    } else {
      setIsContactRequestModalOpen(true);
    }
  };

  const renderDocumentCard = (doc, index) => {
    if (index >= visibleDocumentsCount) {
      return null;
    }
    return (
      <DocumentCard doc={doc} key={doc._id} />
    );
  };

  const notShownDocumentsCount = Math.max(documents.length - visibleDocumentsCount, 0);
  const nextBatchSize = Math.min(DOCUMENTS_BATCH_SIZE, notShownDocumentsCount);

  const contactUserTooltip = contactRequestSentOn
    ? t('contactUserDisabledTooltip', { date: formatDate(contactRequestSentOn), retryInDays: CONTACT_REQUEST_EXPIRATION_IN_DAYS })
    : t('sendContactRequest');

  return (
    <Fragment>
      <PageTemplate contentHeader={<div className="UserProfilePage-contentHeader" />}>
        <div className="UserProfilePage">
          <div className="UserProfilePage-profile">
            <div className="UserProfilePage-profileAvatar">
              <Avatar className="u-avatar" shape="circle" size={AVATAR_SIZE_BIG} src={user.avatarUrl} alt={user.displayName} />
            </div>
            <div className="UserProfilePage-profileButtons">
              {!user.accountClosedOn && (
                <Tooltip title={contactUserTooltip}>
                  <Button icon={<ContactUserIcon />} disabled={isSendingUserContactRequest || !!contactRequestSentOn} onClick={handleContactUserClick} />
                </Tooltip>
              )}
              <FavoriteToggle type={FAVORITE_TYPE.user} id={user._id} showAsButton />
            </div>
            <div className="UserProfilePage-profileTitle">
              <div className="u-page-title">{user.displayName}</div>
            </div>
            <div className="UserProfilePage-profileOrganization">{user.organization}</div>
            <section className="UserProfilePage-profileOverview">
              <Markdown>{user.profileOverview}</Markdown>
            </section>
          </div>

          {!!user.accountClosedOn && (
            <div className="UserProfilePage-accountClosed">{t('common:accountClosed')}</div>
          )}

          {!!fetchingDocuments && <Spinner />}

          {!fetchingDocuments && !!documents.length && (
            <section className="UserProfilePage-section">
              <div className="UserProfilePage-sectionHeadline">{t('documentsHeadline')}</div>
              <div className="UserProfilePage-sectionCards">
                {documents.map(renderDocumentCard)}
              </div>
              {!!nextBatchSize && (
                <div className="UserProfilePage-sectionMoreButton" >
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleMoreDocumentsClick}>
                    {t('moreButton', { count: nextBatchSize })}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </PageTemplate>

      {!!viewingUser && (
        <Modal
          centered
          className='u-modal'
          title={t('sendContactRequest')}
          open={isContactRequestModalOpen}
          okText={t('contactRequestModalOkButton')}
          cancelText={t('common:cancel')}
          okButtonProps={{ loading: isSendingUserContactRequest }}
          cancelButtonProps={{ disabled: isSendingUserContactRequest }}
          onOk={handleContactRequestModalOk}
          onCancel={handleContactRequestModalCancel}
          destroyOnClose
          >
          <div className='u-modal-body UserProfilePage-contactRequestModalContent'>
            <Markdown>{t('contactRequestModalInfoMarkdown', { displayName: user.displayName })}</Markdown>
            <Form
              validateTrigger="onSubmit"
              ref={contactRequestFormRef}
              onFinish={handleContactRequestFormFinish}
              >
              <Form.Item
                name="contactEmailAddress"
                label={t('contactEmailAddressLabel')}
                rules={contactEmailAddressValidationRules}
                >
                <Input disabled={isSendingUserContactRequest} onPressEnter={handleContactRequestFormFinish} />
              </Form.Item>
            </Form>
          </div>
        </Modal>
      )}
    </Fragment>
  );
}

UserProfile.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: publicUserShape.isRequired,
    contactRequestSentOn: PropTypes.string
  }).isRequired
};
