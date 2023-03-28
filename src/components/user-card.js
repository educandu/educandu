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
import { invitationShape, publicUserShape, roomMemberShape } from '../ui/default-prop-types.js';

function UserCard({
  user,
  roomMember,
  roomInvitation,
  avatarUrl,
  favoritedByCount,
  onToggleFavorite,
  onDeleteRoomMember,
  onDeleteRoomInvitation
}) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('userCard');

  const handleCardClick = () => {
    if (user?.id) {
      window.location = routes.getUserProfileUrl(user?.id);
    }
  };

  const renderFavoriteAction = userId => {
    return (
      <div key="favorite">
        <FavoriteStar
          id={userId}
          disabled={!userId}
          type={FAVORITE_TYPE.user}
          onToggle={isFavorite => onToggleFavorite(userId, isFavorite)}
          />
      </div>
    );
  };

  const renderEmailAction = email => {
    return (
      <Tooltip title={t('sendEmailTo', { email })} key="email">
        <a href={`mailto:${encodeURIComponent(email)}`} >
          <MailOutlined />
        </a>
      </Tooltip>
    );
  };

  const renderInfoAction = info => {
    return (
      <Tooltip title={info} key="info">
        <InfoCircleOutlined />
      </Tooltip>
    );
  };

  const actions = [];

  if (user) {
    actions.push(renderFavoriteAction(user._id));
    if (user.email) {
      actions.push(renderEmailAction(user.email));
    }

    if (Number.isInteger(favoritedByCount)) {
      actions.push(renderInfoAction(t('common:favoritedByTooltip', { count: favoritedByCount })));
    }
  }

  if (roomMember) {
    actions.push(renderFavoriteAction(roomMember.userId));
    if (roomMember.email) {
      actions.push(renderEmailAction(roomMember.email));
    }
    actions.push(renderInfoAction(`${t('common:joinedOn')} ${formatDate(roomMember.joinedOn)}`));

    actions.push((
      <Tooltip title={t('removeMember')} key="removeMember">
        <DeleteButton onClick={onDeleteRoomMember} />
      </Tooltip>
    ));
  }

  if (roomInvitation) {
    actions.push((
      <Tooltip title={t('revokeInvitation')} key="revokeInvitation">
        <DeleteButton onClick={onDeleteRoomInvitation} />
      </Tooltip>
    ));
  }

  return (
    <Card className="UserCard" actions={actions}>
      <div className={classNames('UserCard-content', { 'UserCard-content--nonClickable': !user })} onClick={handleCardClick}>
        <Avatar
          shape="circle"
          size={AVATAR_SIZE}
          className="UserCard-avatar u-avatar"
          src={avatarUrl || urlUtils.getGravatarUrl()}
          />
        <div className="UserCard-title">
          {!!user && user.displayName}
          {!!roomMember && roomMember.displayName}
          {!!roomInvitation && t('pendingInvitation')}
        </div>
        {!!user && (
          <div className="UserCard-details">
            {user.shortDescription || user.organization}
          </div>
        )}
        {!!roomMember && (
          <div className="UserCard-details">
            {roomMember.shortDescription || roomMember.organization}
          </div>
        )}
        {!!roomInvitation && (
          <div className="UserCard-details UserCard-details--roomInvitation">
            {!!roomInvitation.email && (
              <div className="UserCard-roomInvitationEmail">
                <MailOutlined />
                <a className="UserCard-roomInvitationEmailLink" href={`mailto:${encodeURI(roomInvitation.email)}`}>{roomInvitation.email}</a>
              </div>
            )}
            <span className="UserCard-roomInvitationDetail">{`${t('common:invitedOn')} ${formatDate(roomInvitation.sentOn)}`}</span>
            <span className="UserCard-roomInvitationDetail">{`${t('invitationExpiresOn')} ${formatDate(roomInvitation.expiresOn)}`}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

UserCard.propTypes = {
  user: publicUserShape,
  roomMember: roomMemberShape,
  roomInvitation: invitationShape,
  avatarUrl: PropTypes.string,
  favoritedByCount: PropTypes.number,
  onToggleFavorite: PropTypes.func,
  onDeleteRoomMember: PropTypes.func,
  onDeleteRoomInvitation: PropTypes.func
};

UserCard.defaultProps = {
  user: null,
  roomMember: null,
  roomInvitation: null,
  avatarUrl: '',
  favoritedByCount: null,
  onToggleFavorite: () => {},
  onDeleteRoomMember: () => {},
  onDeleteRoomInvitation: () => {}
};

export default UserCard;
