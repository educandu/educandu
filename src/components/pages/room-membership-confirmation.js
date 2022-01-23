import { Button } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Countdown from '../countdown.js';
import Logger from '../../common/logger.js';
import React, { Fragment, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { handleApiError } from '../../ui/error-helper.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function RoomMembershipConfirmation({ initialState, PageTemplate, SiteLogo }) {
  const { t } = useTranslation('roomMembershipConfirmation');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const alerts = useGlobalAlerts();

  const { token, roomId, roomName, roomSlug, isValid } = initialState;

  const handleConfirmButtonClick = async () => {
    try {
      setIsLoading(true);
      await roomApiClient.confirmInvitation({ token });
      setHasConfirmed(true);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  };

  let content;
  if (hasConfirmed) {
    content = (
      <Fragment>
        <p>
          <Trans
            t={t}
            i18nKey="confirmationSuccess"
            values={{ roomName }}
            components={[<b key="room-name-bold" />]}
            />
        </p>
        <Countdown
          isRunning
          seconds={10}
          onComplete={() => {
            window.location = urls.getRoomUrl(roomId, roomSlug);
          }}
          >
          {seconds => (
            <Trans
              t={t}
              i18nKey="redirectMessage"
              values={{ roomName, seconds }}
              components={[<a key="login-link" href={urls.getRoomUrl(roomId, roomSlug)} />]}
              />
          )}
        </Countdown>
      </Fragment>
    );
  } else if (isValid) {
    content = (
      <Fragment>
        <p>
          <Trans
            t={t}
            i18nKey="invitationConfirmation"
            values={{ roomName }}
            components={[<b key="room-name-bold" />]}
            />
        </p>
        <p className="RoomMembershipConfirmationPage-disclaimer">
          {t('invitationConfirmationDisclaimer')}
        </p>
        <p>
          <Button type="primary" loading={isLoading} onClick={handleConfirmButtonClick}>
            {t('joinButton')}
          </Button>
        </p>
      </Fragment>
    );
  } else {
    content = (
      <Fragment>
        <p>{t('invalidOrExpiredInvitationCode')}</p>
        <a href={urls.getHomeUrl()}>{t('homeLink')}</a>
      </Fragment>
    );
  }

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="RoomMembershipConfirmationPage">
        <div className="RoomMembershipConfirmationPage-title">
          <SiteLogo readonly />
        </div>
        <div className="RoomMembershipConfirmationPage-message">
          {content}
        </div>
      </div>
    </PageTemplate>
  );
}

RoomMembershipConfirmation.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    token: PropTypes.string,
    roomId: PropTypes.string,
    roomName: PropTypes.string,
    roomSlug: PropTypes.string,
    isValid: PropTypes.bool.isRequired
  }).isRequired
};

export default RoomMembershipConfirmation;
