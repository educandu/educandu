import { Button } from 'antd';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import Countdown from '../countdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import React, { Fragment, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { handleApiError } from '../../ui/error-helper.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { INVALID_ROOM_INVITATION_REASON } from '../../domain/constants.js';

const logger = new Logger(import.meta.url);

function RoomMembershipConfirmation({ initialState, PageTemplate, SiteLogo }) {
  const { t } = useTranslation('roomMembershipConfirmation');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [fetchingConfirmation, setFetchingConfirmation] = useDebouncedFetchingState(true);

  const { token, roomId, roomName, roomSlug, invalidInvitationReason } = initialState;

  useEffect(() => {
    (async () => {
      if (!invalidInvitationReason && !!fetchingConfirmation) {
        try {
          await roomApiClient.confirmInvitation({ token });
          setFetchingConfirmation(false);
        } catch (error) {
          handleApiError({ error, logger, t });
        }
      }
    })();
  }, [token, invalidInvitationReason, fetchingConfirmation, setFetchingConfirmation, t, roomApiClient]);

  const redirectToRoom = () => {
    window.location = routes.getRoomUrl({ id: roomId, slug: roomSlug });
  };

  const renderSuccessMessage = () => {
    return (
      <Fragment>
        <p>
          <Trans t={t} i18nKey="confirmationSuccess" values={{ roomName }} components={[<b key="room-name-bold" />]} />
        </p>
        <Countdown isRunning seconds={10} onComplete={redirectToRoom}>
          {seconds => t('redirectMessage', { roomName, seconds })}
        </Countdown>
        <Button type="primary" onClick={redirectToRoom}>{t('common:enterRoom')}</Button>
      </Fragment>
    );
  };

  const renderInvalidMessage = text => (
    <Fragment>
      <p>{text}</p>
      <a href={routes.getHomeUrl()}>{t('homeLink')}</a>
    </Fragment>
  );

  return (
    <PageTemplate fullScreen>
      <div className="RoomMembershipConfirmationPage">
        <div className="RoomMembershipConfirmationPage-title">
          <SiteLogo readonly />
        </div>
        <div className="RoomMembershipConfirmationPage-message">
          {!invalidInvitationReason && !!fetchingConfirmation && <Spinner tip={t('spinnerMessage')} />}
          {!invalidInvitationReason && !fetchingConfirmation && renderSuccessMessage()}
          {invalidInvitationReason === INVALID_ROOM_INVITATION_REASON.token && renderInvalidMessage(t('invalidToken'))}
          {invalidInvitationReason === INVALID_ROOM_INVITATION_REASON.room && renderInvalidMessage(t('invalidRoom'))}
          {invalidInvitationReason === INVALID_ROOM_INVITATION_REASON.differenUser && renderInvalidMessage(t('differentUser'))}
          {invalidInvitationReason === INVALID_ROOM_INVITATION_REASON.unconfirmedUser && renderInvalidMessage(t('unconfirmedUser'))}
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
    invalidInvitationReason: PropTypes.oneOf(Object.values(INVALID_ROOM_INVITATION_REASON))
  }).isRequired
};

export default RoomMembershipConfirmation;
