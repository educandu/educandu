import React from 'react';
import PropTypes from 'prop-types';
import { Row, Space, List } from 'antd';
import { useTranslation } from 'react-i18next';
import { roomShape } from '../ui/default-prop-types.js';
import { useDateFormat } from '../components/language-context.js';

export default function Room({ PageTemplate, initialState }) {
  const { t } = useTranslation('room');
  const { formatDate } = useDateFormat();
  const { roomDetails } = initialState;

  return (
    <PageTemplate>
      <h1> {t('pageNames:room', { roomName: roomDetails.name })}</h1>
      <Row>
        <Space>
          <span>{t('ownerUsername')}:</span>
          <span> {roomDetails.owner.username}</span>
        </Space>
      </Row>
      <List
        dataSource={roomDetails.members}
        renderItem={member => (
          <List.Item>
            <Space>
              <Space>
                <span>{t('memberUsername')}:</span>
                <span>{member.username}</span>
              </Space>

              <Space>
                <span>{t('joinedOn')}:</span>
                <span>{formatDate(member.joinedOn)}</span>
              </Space>
            </Space>
          </List.Item>)}
        />
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    roomDetails: roomShape
  }).isRequired
};
