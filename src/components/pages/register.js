import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import RegistrationForm from '../registration-form.js';

function Register({ PageTemplate, SiteLogo }) {
  const formRef = useRef();

  const handleRegistrationStarted = () => {};

  const handleRegistrationFailed = () => {};

  const handleRegistrationSucceeded = () => {};

  return (
    <PageTemplate fullScreen>
      <div className="RegisterPage">
        <div className="RegisterPage-title">
          <SiteLogo readonly />
        </div>
        <div className="RegisterPage-form">
          <RegistrationForm
            formRef={formRef}
            name="register-page-registration-form"
            onRegistrationFailed={handleRegistrationFailed}
            onRegistrationStarted={handleRegistrationStarted}
            onRegistrationSucceeded={handleRegistrationSucceeded}
            />
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
