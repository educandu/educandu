import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import routes from './../utils/routes.js';
import Logger from './../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useStableCallback } from '../ui/hooks.js';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from './locale-context.js';
import { HTTP_STATUS } from './../domain/constants.js';
import { handleApiError } from './../ui/error-helper.js';
import { Form, Button, Input, Steps, Result } from 'antd';
import { memoAndTransformProps } from '../ui/react-helper.js';
import { LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons';

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

function UserStepsForm({
  title,
  enterDataForm,
  enterDataFormContent,
  enterDataFormButtonText,
  verificationMessageDisclaimer,
  codeExpirationInMinutes,
  completedMessageTitle,
  completedMessageSubtitle,
  onEnterDataStart,
  onEnterDataFinish,
  onEnterCodeFinish
}) {
  const [enterCodeForm] = Form.useForm();
  const { formatDuration } = useDateFormat();
  const { t } = useTranslation('userStepsForm');

  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState(createDefaultSteps());
  const [currentStepKey, setCurrentStepKey] = useState(STEP.enterData);
  const [invalidVerificationCodes, setInvalidVerificationCodes] = useState([]);

  useEffect(() => {
    if (currentStepKey === STEP.enterData) {
      onEnterDataStart();
      setInvalidVerificationCodes([]);
      setSteps(setStepProcess(createDefaultSteps(), currentStepKey));
    } else {
      setSteps(prev => setStepProcess(prev, currentStepKey));
    }
  }, [currentStepKey, onEnterDataStart]);

  const handleEnterDataButtonClick = () => {
    enterDataForm.submit();
  };

  const handleEnterCodeButtonClick = () => {
    enterCodeForm.submit();
  };

  const handleEnterDataFinish = async data => {
    try {
      setIsLoading(true);
      const isSuccessfull = await onEnterDataFinish(data);
      if (isSuccessfull) {
        setCurrentStepKey(STEP.enterCode);
        setSteps(prev => setStepSuccess(prev, STEP.enterData));
      } else {
        setSteps(prev => setStepError(prev, STEP.enterData));
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
      await onEnterCodeFinish({ verificationCode });
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
    return (
      <div>
        <Form
          layout="vertical"
          scrollToFirstError
          form={enterDataForm}
          validateTrigger="onSubmit"
          onFinish={handleEnterDataFinish}
          >
          {enterDataFormContent}
        </Form>
        <div className="UserStepsForm-button">
          <Button type="primary" size="large" onClick={handleEnterDataButtonClick} block>
            {enterDataFormButtonText}
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
      <div>
        <div className="UserStepsForm-verificationMessageWrapper">
          <Markdown className="UserStepsForm-verificationMessage">
            {t('verificationMessage', { validityInMinutes: formatDuration(codeExpirationInMinutes, 'minutes') })}
          </Markdown>
          {verificationMessageDisclaimer}
        </div>
        <Form
          layout="vertical"
          scrollToFirstError
          form={enterCodeForm}
          validateTrigger="onSubmit"
          onFinish={handleEnterCodeFinish}
          >
          <FormItem name="verificationCode" label={t('verificationCode')} rules={verificationCodeValidationRules}>
            <Input />
          </FormItem>
        </Form>
        <div className="UserStepsForm-button">
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
      title={completedMessageTitle}
      subTitle={completedMessageSubtitle}
      extra={[
        <Button
          block
          key="login"
          size="large"
          type="primary"
          onClick={handleGotoDashboardClick}
          >
          {t('gotoDashboard')}
        </Button>
      ]}
      />
  );

  const renderStepTitel = step => (
    <span className={classNames({ 'UserStepsForm-step': true, 'is-selected': currentStepKey === step.key })}>
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
      <div className="UserStepsForm-steps">
        <Steps items={stepItems} labelPlacement="vertical" size="small" />
      </div>
    );
  };

  return (
    <div className="UserStepsForm u-panel">
      <div className="UserStepsForm-title">{title}</div>
      {renderSteps()}
      {currentStepKey === STEP.enterData && renderEnterDataForm()}
      {currentStepKey === STEP.enterCode && renderEnterCodeForm()}
      {currentStepKey === STEP.completed && renderCompletedMessage()}
    </div>
  );
}

UserStepsForm.propTypes = {
  title: PropTypes.string.isRequired,
  enterDataForm: PropTypes.object.isRequired,
  enterDataFormContent: PropTypes.node.isRequired,
  enterDataFormButtonText: PropTypes.string.isRequired,
  verificationMessageDisclaimer: PropTypes.node,
  codeExpirationInMinutes: PropTypes.number.isRequired,
  completedMessageTitle: PropTypes.string.isRequired,
  completedMessageSubtitle: PropTypes.string.isRequired,
  onEnterDataStart: PropTypes.func,
  onEnterDataFinish: PropTypes.func.isRequired,
  onEnterCodeFinish: PropTypes.func.isRequired
};

UserStepsForm.defaultProps = {
  verificationMessageDisclaimer: null,
  onEnterDataStart: () => {}
};

export default memoAndTransformProps(UserStepsForm, ({
  onEnterDataStart,
  ...rest
}) => ({
  onEnterDataStart: useStableCallback(onEnterDataStart),
  ...rest
}));
