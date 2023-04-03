import by from 'thenby';
import Info from '../info.js';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import EmptyState from '../empty-state.js';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { MailOutlined } from '@ant-design/icons';
import { Button, Tooltip, Checkbox } from 'antd';
import { useLoadingState } from '../../ui/hooks.js';
import { useDateFormat } from '../locale-context.js';
import WriteIcon from '../icons/general/write-icon.js';
import MessageIcon from '../icons/general/message-icon.js';
import React, { Fragment, useEffect, useState } from 'react';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { roomMessageShape } from '../../ui/default-prop-types.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmRoomMessageDelete } from '../confirmation-dialogs.js';

export default function MessageBoard({ roomId, initialMessages, canManageMessages }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('messageBoard');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [messages, setMessages] = useState(initialMessages);

  const [newMessageText, setNewMessageText] = useState('');
  const [isPostingNewMessage, setIsPostingNewMessage] = useLoadingState(false);
  const [newMessageEmailNotification, setNewMessageEmailNotification] = useState(false);
  const [showEmptyState, setEmptyState] = useState(!!canManageMessages && !initialMessages.length);

  useEffect(() => {
    if (!!canManageMessages && !messages.length) {
      setEmptyState(true);
    }
  }, [canManageMessages, messages]);

  const handleNewMessageTextChange = event => {
    const { value } = event.target;
    setNewMessageText(value);
  };

  const handlePostNewMessageClick = async () => {
    setIsPostingNewMessage(true);

    const response = await roomApiClient.addRoomMessage({
      roomId,
      text: newMessageText.trim(),
      emailNotification: newMessageEmailNotification
    });

    await setIsPostingNewMessage(false);

    setNewMessageText('');
    setMessages(response.room.messages);
    setNewMessageEmailNotification(false);
  };

  const handleNewMessageEmailNotificationChange = event => {
    const { checked } = event.target;
    setNewMessageEmailNotification(checked);
  };

  const handleDeleteMessageClick = msg => {
    confirmRoomMessageDelete(t, formatDate(msg.createdOn), async () => {
      const response = await roomApiClient.deleteRoomMessage({ roomId, messageKey: msg.key });
      setMessages(response.room.messages);
    });
  };

  const renderMessages = () => {
    const sortedMessages = messages.sort(by(msg => msg.createdOn, 'desc'));

    return (
      <div className="MessageBoard-messages">
        {sortedMessages.map(msg => (
          <div key={msg.key} className="MessageBoard-message">
            <div className="MessageBoard-messageHeadline">
              <div>{formatDate(msg.createdOn)}</div>
              <div className="MessageBoard-messageHeadlineIcons">
                {!!msg.emailNotification && (
                  <div className="MessageBoard-messageIcon">
                    <Tooltip title={t('emailNotificationIconTooltip')}>
                      <MailOutlined />
                    </Tooltip>
                  </div>
                )}
                {!!canManageMessages && (
                  <DeleteButton onClick={() => handleDeleteMessageClick(msg)} />
                )}
              </div>
            </div>
            <div className="MessageBoard-messageText">
              <Markdown>{msg.text}</Markdown>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNewMessagePostingSection = () => {
    return (
      <div className="MessageBoard-postingSection">
        <MarkdownInput
          preview
          value={newMessageText}
          disabled={isPostingNewMessage}
          onChange={handleNewMessageTextChange}
          />
        <div className="MessageBoard-postingSectionControls">
          <Checkbox
            checked={newMessageEmailNotification}
            disabled={isPostingNewMessage}
            onChange={handleNewMessageEmailNotificationChange}
            >
            <Info tooltip={t('postMessageCheckboxInfo')} iconAfterContent>
              {t('postMessageCheckboxText')}
            </Info>
          </Checkbox>
          <Button
            type="primary"
            loading={isPostingNewMessage}
            disabled={!newMessageText.trim().length}
            onClick={handlePostNewMessageClick}
            >
            {t('postMessageButtonText')}
          </Button>
        </div>
      </div>
    );
  };

  if (!canManageMessages && !messages.length) {
    return null;
  }

  return (
    <section className="MessageBoard">
      <div className="MessageBoard-headline">{t('headline')}</div>

      {!!canManageMessages && (
        <Fragment>
          {!!showEmptyState && (
            <EmptyState
              icon={<MessageIcon />}
              title={t('emptyStateTitle')}
              subtitle={t('emptyStateSubtitle')}
              button={{
                text: t('writeMessage'),
                icon: <WriteIcon />,
                onClick: () => setEmptyState(false)
              }}
              />
          )}
          {!showEmptyState && renderNewMessagePostingSection()}
        </Fragment>
      )}
      {renderMessages()}
    </section>
  );
}

MessageBoard.propTypes = {
  roomId: PropTypes.string.isRequired,
  initialMessages: PropTypes.arrayOf(roomMessageShape).isRequired,
  canManageMessages: PropTypes.bool.isRequired
};
