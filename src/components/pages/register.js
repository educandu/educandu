import React from 'react';
import PropTypes from 'prop-types';
import RegistrationForm from '../registration-form.js';

function Register({ PageTemplate, SiteLogo }) {
  return (
    <PageTemplate fullScreen>
      <div className="RegisterPage">
        <div className="RegisterPage-title">
          <SiteLogo readonly />
        </div>
        <div className="RegisterPage-form">
          <RegistrationForm />
        </div>
      </div>
    </PageTemplate>
  );
}

Register.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Register;
