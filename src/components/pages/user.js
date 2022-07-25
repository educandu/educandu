import React from 'react';
import PropTypes from 'prop-types';
import { publicUserShape } from '../../ui/default-prop-types.js';

export default function User({ PageTemplate, initialState }) {
  return (
    <PageTemplate>
      <div className="UserPage">
        {initialState.user.displayName}
      </div>
    </PageTemplate>
  );
}

User.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: publicUserShape.isRequired
  }).isRequired
};
