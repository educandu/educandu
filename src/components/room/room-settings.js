import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { Button, message, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import RoomMetadataForm from '../room-metadata-form.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { useEffect, useRef, useState } from 'react';
import { roomShape } from '../../ui/default-prop-types.js';
import { confirmRoomDelete } from '../confirmation-dialogs.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import IrreversibleActionsSection from '../irreversible-actions-section.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

export default function RoomSettings({ room, onChange }) {
  const contentFormRef = useRef(null);
  const metadataFormRef = useRef(null);
  const { t } = useTranslation('roomSettings');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [isRoomContentUpdateButtonDisabled, setIsRoomContentUpdateButtonDisabled] = useState(true);
  const [isRoomMetadataUpdateButtonDisabled, setIsRoomMetadataUpdateButtonDisabled] = useState(true);

  useEffect(() => {
    history.replaceState(null, '', routes.getRoomUrl(room._id, room.slug));
  }, [room._id, room.slug]);

  const handleRoomDelete = async () => {
    try {
      await roomApiClient.deleteRoom({ roomId: room._id });
      window.location = routes.getDashboardUrl({ tab: 'rooms' });
    } catch (error) {
      handleApiError({ error, t, logger });
    }
  };

  const handleDeleteRoomClick = () => {
    confirmRoomDelete(t, room.name, handleRoomDelete);
  };

  const handleUpdateRoomContentClick = () => {
    if (contentFormRef.current) {
      contentFormRef.current.submit();
    }
  };

  const handleRoomContentFormFieldsChanged = () => {
    setIsRoomContentUpdateButtonDisabled(false);
  };

  const handleRoomContentFormSubmitted = async ({ overview }) => {
    try {
      const response = await roomApiClient.updateRoomContent({ roomId: room._id, overview });

      onChange(response.room);
      setIsRoomContentUpdateButtonDisabled(true);
      message.success(t('common:changesSavedSuccessfully'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleUpdateRoomMetadataClick = () => {
    if (metadataFormRef.current) {
      metadataFormRef.current.submit();
    }
  };

  const handleRoomMetadataFormSubmitted = async ({ name, slug, isCollaborative, shortDescription }) => {
    try {
      const response = await roomApiClient.updateRoomMetadata({ roomId: room._id, name, slug, isCollaborative, shortDescription });

      onChange(response.room);
      setIsRoomMetadataUpdateButtonDisabled(true);
      message.success(t('common:changesSavedSuccessfully'));
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const handleRoomMetadataFormFieldsChanged = () => {
    setIsRoomMetadataUpdateButtonDisabled(false);
  };

  return (
    <div className="RoomSettings" >
      <div className="RoomSettings-headline">{t('contentHeadline')}</div>
      <section className="RoomSettings-section">
        <Form
          layout="vertical"
          ref={contentFormRef}
          name="room-content-form"
          onFinish={handleRoomContentFormSubmitted}
          onFieldsChange={handleRoomContentFormFieldsChanged}
          >
          <FormItem label={t('overview')} name="overview" initialValue={room.overview}>
            <MarkdownInput preview />
          </FormItem>
        </Form>
        <Button
          type="primary"
          disabled={isRoomContentUpdateButtonDisabled}
          onClick={handleUpdateRoomContentClick}
          >
          {t('common:update')}
        </Button>
      </section>
      <div className="RoomSettings-headline">{t('metadataHeadline')}</div>
      <section className="RoomSettings-section">
        <RoomMetadataForm
          editMode
          room={room}
          formRef={metadataFormRef}
          onSubmit={handleRoomMetadataFormSubmitted}
          onFieldsChange={handleRoomMetadataFormFieldsChanged}
          />
        <Button
          type="primary"
          disabled={isRoomMetadataUpdateButtonDisabled}
          onClick={handleUpdateRoomMetadataClick}
          >
          {t('common:update')}
        </Button>
      </section>
      <IrreversibleActionsSection
        className="RoomSettings-irreversibleActionsSection"
        actions={[
          {
            name: t('deleteTitle'),
            description: t('deleteDescription'),
            button: {
              text: t('deleteButton'),
              icon: <DeleteIcon />,
              onClick: handleDeleteRoomClick
            }
          }
        ]}
        />
    </div>
  );
}

RoomSettings.propTypes = {
  room: roomShape.isRequired,
  onChange: PropTypes.func.isRequired
};
