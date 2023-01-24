import classNames from 'classnames';
import Markdown from './markdown.js';
import routes from './../utils/routes.js';
import Logger from './../common/logger.js';
import { useSetUser } from './user-context.js';
import EmailFormItem from './email-form-item.js';
import React, { useEffect, useState } from 'react';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { Trans, useTranslation } from 'react-i18next';
import PasswordFormItem from './password-form-item.js';
import { handleApiError } from './../ui/error-helper.js';
import DisplayNameFormItem from './displayName-form-item.js';
import { useDateFormat, useLocale } from './locale-context.js';
import UserApiClient from './../api-clients/user-api-client.js';
import { Form, Button, Checkbox, Input, Steps, Result } from 'antd';
import { LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons';
import { HTTP_STATUS, PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES, SAVE_USER_RESULT } from './../domain/constants.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;

const STEP = {
  enterData: 'enterData',
  enterCode: 'enterCode',
  completed: 'completed'
};

const STEP_STATE = {
  wait: 'wait',
  process: 'process',
  finish: 'finish',
  error: 'error'
};

const createDefaultSteps = () => [
  {
    key: STEP.enterData,
    status: STEP_STATE.wait,
    icon: <UserOutlined />,
    translationKey: 'step_enterData'
  },
  {
    key: STEP.enterCode,
    status: STEP_STATE.wait,
    icon: <SolutionOutlined />,
    translationKey: 'step_enterCode'
  },
  {
    key: STEP.completed,
    status: STEP_STATE.wait,
    icon: <SmileOutlined />,
    translationKey: 'step_completed'
  }
];

const setStepError = (steps, key) => steps.map(step => step.key === key ? { ...step, status: STEP_STATE.error } : step);
const setStepSuccess = (steps, key) => steps.map(step => step.key === key ? { ...step, status: STEP_STATE.finish } : step);
const setStepProcess = (steps, key) => steps.map(step => step.key === key ? { ...step, status: STEP_STATE.process } : step);

function RegistrationForm() {
  const setUser = useSetUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const [enterDataForm] = Form.useForm();
  const [enterCodeForm] = Form.useForm();
  const { formatDuration } = useDateFormat();
  const userApiClient = useService(UserApiClient);
  const { t } = useTranslation('registrationForm');
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [steps, setSteps] = useState(createDefaultSteps());
  const [forbiddenEmails, setForbiddenEmails] = useState([]);
  const [currentStepKey, setCurrentStepKey] = useState(STEP.enterData);
  const [invalidVerificationCodes, setInvalidVerificationCodes] = useState([]);

  useEffect(() => {
    if (currentStepKey === STEP.enterData) {
      setCreatedUser(null);
      setForbiddenEmails([]);
      setInvalidVerificationCodes([]);
      setSteps(setStepProcess(createDefaultSteps(), currentStepKey));
    } else {
      setSteps(prev => setStepProcess(prev, currentStepKey));
    }
  }, [currentStepKey]);

  const handleEnterDataButtonClick = () => {
    enterDataForm.submit();
  };

  const handleEnterCodeButtonClick = () => {
    enterCodeForm.submit();
  };

  const handleEnterDataFinish = async ({ email, password, displayName }) => {
    try {
      setIsLoading(true);
      const { result, user } = await userApiClient.requestRegistration({
        email: email.trim(),
        password,
        displayName: displayName.trim()
      });
      switch (result) {
        case SAVE_USER_RESULT.success:
          setCreatedUser(user);
          setCurrentStepKey(STEP.enterCode);
          setSteps(prev => setStepSuccess(prev, STEP.enterData));
          break;
        case SAVE_USER_RESULT.duplicateEmail:
          setForbiddenEmails(prevState => [...prevState, email.toLowerCase()]);
          setSteps(prev => setStepError(prev, STEP.enterData));
          setTimeout(() => enterDataForm.validateFields(['email'], { force: true }), 0);
          break;
        default:
          throw new Error(`Unknown result: ${result}`);
      }
    } catch (error) {
      handleApiError({ error, logger, t });
      setSteps(prev => setStepError(prev, STEP.enterData));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterCodeFinish = async ({ verificationCode }) => {
    try {
      setIsLoading(true);
      const { user } = await userApiClient.completeRegistration({
        userId: createdUser._id,
        verificationCode: verificationCode.trim()
      });
      setUser(user);
      setCreatedUser(user);
      setCurrentStepKey(STEP.completed);
      setSteps(prev => setStepSuccess(prev, STEP.enterCode));
    } catch (error) {
      if (error.status === HTTP_STATUS.notFound) {
        setInvalidVerificationCodes(prevState => [...prevState, verificationCode]);
        setTimeout(() => enterCodeForm.validateFields(['verificationCode'], { force: true }), 0);
      } else {
        handleApiError({ error, logger, t });
      }
      setSteps(prev => setStepError(prev, STEP.enterCode));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGotoDashboardClick = () => {
    window.location = routes.getDashboardUrl();
  };

  const renderEnterDataForm = () => {
    const termsPage = settings.termsPage?.[uiLanguage];
    const agreementValidationRules = [
      {
        message: t('confirmTerms'),
        validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('confirmTerms')))
      }
    ];
    return (
      <div className="RegistrationForm-form">
        <Form
          form={enterDataForm}
          layout="vertical"
          onFinish={handleEnterDataFinish}
          validateTrigger="onSubmit"
          scrollToFirstError
          >
          <EmailFormItem name="email" emailsInUse={forbiddenEmails} />
          <PasswordFormItem name="password" />
          <DisplayNameFormItem name="displayName" />
          <FormItem name="agreement" valuePropName="checked" rules={agreementValidationRules}>
            <Checkbox className="RegistrationForm-termsAndConditionsCheckbox">
              <Trans
                t={t}
                i18nKey="termsAndConditionsConfirmation"
                components={[
                  <a
                    key="terms-link"
                    title={termsPage?.linkTitle || null}
                    href={termsPage?.documentId ? routes.getDocUrl({ id: termsPage.documentId }) : '#'}
                    />
                ]}
                />
            </Checkbox>
          </FormItem>
        </Form>
        <div className="RegistrationForm-registerButton">
          <Button type="primary" size="large" onClick={handleEnterDataButtonClick} block>
            {t('register')}
          </Button>
        </div>
      </div>
    );
  };

  const renderEnterCodeForm = () => {
    const verificationCodeValidationRules = [
      {
        required: true,
        message: t('enterVerificationCode'),
        whitespace: true
      },
      {
        validator: (_rule, value) => {
          return value && invalidVerificationCodes.includes(value)
            ? Promise.reject(new Error(t('verificationCodeIsInvalid')))
            : Promise.resolve();
        }
      }
    ];
    return (
      <div className="RegistrationForm-form">
        <Markdown className="RegistrationForm-verificationMessage">
          {t('verificationMessage', { validityInMinutes: formatDuration(PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES, 'minutes') })}
        </Markdown>
        <Form
          form={enterCodeForm}
          layout="vertical"
          onFinish={handleEnterCodeFinish}
          validateTrigger="onSubmit"
          scrollToFirstError
          >
          <FormItem name="verificationCode" label={t('verificationCode')} rules={verificationCodeValidationRules}>
            <Input />
          </FormItem>
        </Form>
        <div className="RegistrationForm-registerButton">
          <Button type="primary" size="large" onClick={handleEnterCodeButtonClick} block>
            {t('common:confirm')}
          </Button>
        </div>
      </div>
    );
  };

  const renderCompletedMessage = () => (
    <Result
      status="success"
      title={t('completedMessageTitle')}
      subTitle={t('completedMessageSubTitle')}
      extra={[<Button key="login" type="primary" onClick={handleGotoDashboardClick}>{t('gotoDashboard')}</Button>]}
      />
  );

  const renderStepTitel = step => (
    <span className={classNames({ 'RegistrationForm-step': true, 'is-selected': currentStepKey === step.key })}>
      {t(step.translationKey)}
    </span>
  );

  const renderStepIcon = step => isLoading && currentStepKey === step.key ? <LoadingOutlined /> : step.icon;

  const renderSteps = () => {
    const stepItems = steps.map(step => ({
      title: renderStepTitel(step),
      icon: renderStepIcon(step),
      status: step.status
    }));
    return (
      <div className="RegistrationForm-steps">
        <Steps items={stepItems} labelPlacement="vertical" size="small" />
      </div>
    );
  };

  return (
    <div className="RegistrationForm u-panel">
      {renderSteps()}
      {currentStepKey === STEP.enterData && renderEnterDataForm()}
      {currentStepKey === STEP.enterCode && renderEnterCodeForm()}
      {currentStepKey === STEP.completed && renderCompletedMessage()}
    </div>
  );
}

export default RegistrationForm;
