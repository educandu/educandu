import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { roomDetailsShape } from '../../ui/default-prop-types.js';

export default function Room({ PageTemplate, initialState }) {
  const { t } = useTranslation('room');
  const { roomDetails } = initialState;

  return (
    <PageTemplate>
      <h2> {t('pageNames:room', { roomName: roomDetails.name })}</h2>
    </PageTemplate>);
}

Room.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    roomDetails: roomDetailsShape
  }).isRequired
};
