import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { Avatar, Card, Tooltip } from 'antd';
import FavoriteStar from './favorite-star.js';
import DeleteButton from './delete-button.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { AVATAR_SIZE, FAVORITE_TYPE } from '../domain/constants.js';
import { InfoCircleOutlined, MailOutlined } from '@ant-design/icons';
import { favoriteUserShape, invitationShape, roomMemberShape } from '../ui/default-prop-types.js';

function UserCard({
  favoriteUser,
  roomMember,
  roomInvitation,
  onToggleFavorite,
  onDeleteRoomMember,
  onDeleteRoomInvitation
}) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('userCard');

  const accessibleUser = favoriteUser?.data || roomMember;
  const userId = favoriteUser?.id || roomMember?.userId || roomInvitation?.userId;
  const userEmail = favoriteUser?.data?.email || roomMember?.email || roomInvitation?.email;
  const avatarUrl = favoriteUser?.data?.avatarUrl || roomMember?.avatarUrl || roomInvitation?.avatarUrl;

  const handleCardClick = () => {
    if (accessibleUser) {
      window.location = routes.getUserProfileUrl(userId);
    }
  };

  const renderFavoriteAction = () => {
    return (
      <div key="favorite">
        <FavoriteStar
          id={userId}
          type={FAVORITE_TYPE.user}
          onToggle={isFavorite => onToggleFavorite(userId, isFavorite)}
          />
      </div>
    );
  };

  const renderEmailAction = () => {
    return (
      <Tooltip title={t('sendEmailTo', { email: userEmail })} key="email">
        <a href={`mailto:${encodeURIComponent(userEmail)}`} >
          <MailOutlined />
        </a>
      </Tooltip>
    );
  };

  const renderInfoAction = info => {
    return (
      <Tooltip title={info} key="info">
        <div className="UserCard-helpAction"><InfoCircleOutlined /></div>
      </Tooltip>
    );
  };

  const actions = [];

  if (accessibleUser) {
    actions.push(renderFavoriteAction());
  }

  if (userEmail) {
    actions.push(renderEmailAction());
  }

  if (favoriteUser) {
    actions.push(renderInfoAction(t('common:favoritedByTooltip', { count: favoriteUser.favoritedByCount })));
  }

  if (roomMember) {
    actions.push(renderInfoAction(t('common:joinedOnDate', { date: formatDate(roomMember.joinedOn) })));

    actions.push((
      <Tooltip title={t('removeMember')} key="removeMember">
        <DeleteButton onClick={onDeleteRoomMember} />
      </Tooltip>
    ));
  }

  if (roomInvitation) {
    actions.push(renderInfoAction((
      <div className="UserCard-infoTooltip">
        <div>{t('common:invitedOnDate', { date: formatDate(roomInvitation.sentOn) })}</div>
        <div>{t('invitationExpiresOnDate', { date: formatDate(roomInvitation.expiresOn) })}</div>
      </div>
    )));

    actions.push((
      <Tooltip title={t('revokeInvitation')} key="revokeInvitation">
        <DeleteButton onClick={onDeleteRoomInvitation} />
      </Tooltip>
    ));
  }

  return (
    <Card className="UserCard" actions={actions}>
      <div
        className={classNames('UserCard-content', { 'UserCard-content--noAccount': !accessibleUser })}
        onClick={handleCardClick}
        >
        <Avatar
          shape="circle"
          size={AVATAR_SIZE}
          className="UserCard-avatar u-avatar"
          src={avatarUrl || urlUtils.getGravatarUrl()}
          />
        <div className="UserCard-title">
          {accessibleUser?.displayName}
          {roomInvitation?.email}
        </div>
        <div className="UserCard-details">
          {!!accessibleUser && !accessibleUser.accounClosedOn && (accessibleUser.shortDescription || accessibleUser.organization)}
          <div className="UserCard-detailsMissingData">
            {!!accessibleUser?.accountClosedOn && t('common:accountClosed')}
            {!!roomInvitation && t('pendingInvitation')}
          </div>
        </div>
      </div>
    </Card>
  );
}

UserCard.propTypes = {
  favoriteUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    setOn: PropTypes.string.isRequired,
    favoritedByCount: PropTypes.number,
    data: favoriteUserShape.isRequired
  }),
  roomMember: roomMemberShape,
  roomInvitation: invitationShape,
  onToggleFavorite: PropTypes.func,
  onDeleteRoomMember: PropTypes.func,
  onDeleteRoomInvitation: PropTypes.func
};

UserCard.defaultProps = {
  favoriteUser: null,
  roomMember: null,
  roomInvitation: null,
  onToggleFavorite: () => {},
  onDeleteRoomMember: () => {},
  onDeleteRoomInvitation: () => {}
};

export default UserCard;
