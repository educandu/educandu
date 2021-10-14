import React from 'react';
import { Modal, Input, Checkbox, Form } from 'antd';

const confirm = Modal.confirm;
const TextArea = Input.TextArea;
const FormItem = Form.Item;

export function confirmSectionDelete(t, section, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteSectionConfirmation'),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmSectionHardDelete(
  t,
  section,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let deletionReason = '';
  let deleteDescendants = false;
  let handleDeletionReasonChange = null;
  let handleDeleteDescendantsChange = null;
  let createDialogProps = null;

  handleDeletionReasonChange = event => {
    deletionReason = event.target.value;
    dialog.update(createDialogProps());
  };

  handleDeleteDescendantsChange = event => {
    deleteDescendants = event.target.checked;
    dialog.update(createDialogProps());
  };

  function createContent() {
    return (
      <div>
        {t('confirmationDialogs:deleteSectionConfirmation')}
        <br />
        <b className="u-danger">
          {t('confirmationDialogs:thisActionIsIrreversible')}
        </b>
        <br />
        <br />
        <span>{t('confirmationDialogs:pleaseSpecifyAReason')}:</span>
        <br />
        <TextArea
          value={deletionReason}
          onChange={handleDeletionReasonChange}
          />
        <br />
        <br />
        <Checkbox
          value={deleteDescendants}
          onChange={handleDeleteDescendantsChange}
          >
          {t('confirmationDialogs:deleteAllDescendantRevisions')}
        </Checkbox>
      </div>
    );
  }

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: createContent(),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: () => onOk({ deleteDescendants, deletionReason }),
    onCancel,
    okButtonProps: {
      disabled: deletionReason.length < 3
    }
  });

  dialog = confirm(createDialogProps());
}

export function confirmDocumentRevisionRestoration(
  t,
  revision,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let isRestoring = false;
  let createDialogProps = null;

  const handleOkClick = async () => {
    isRestoring = true;
    dialog.update(createDialogProps());
    try {
      await onOk();
    } finally {
      isRestoring = false;
      dialog.update(createDialogProps());
    }
  };

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:restoreDocumentRevisionConfirmation', {
      revisionId: revision._id
    }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: handleOkClick,
    onCancel,
    okButtonProps: {
      loading: isRestoring
    }
  });

  dialog = confirm(createDialogProps());
}

export function confirmIdentityWithPassword({
  t,
  username,
  userApiClient,
  onOk,
  onCancel = () => {}
}) {
  let dialog = null;
  let createDialogProps = null;
  let passwordValue = '';
  let validationStatus = '';
  let errorMessage = '';

  const handleConfirmPassword = async password => {
    try {
      const { user } = await userApiClient.login({ username, password });
      if (user) {
        validationStatus = 'success';
        errorMessage = '';
        onOk();
        return true;
      }
    } catch (error) {
      Modal.error({ title: t('common:error'), content: error.message });
      return false;
    }

    validationStatus = 'error';
    errorMessage = t('confirmationDialogs:wrongPasswordProvided');
    dialog.update(createDialogProps());
    return false;
  };

  const handlePasswordChanged = e => {
    passwordValue = e.target.value;
    dialog.update(createDialogProps());
  };

  const createContent = () => (
    <Form>
      <FormItem
        label={t('confirmationDialogs:confirmPassword')}
        validateStatus={validationStatus}
        help={errorMessage}
        >
        <Input type="password" onChange={handlePasswordChanged} />
      </FormItem>
    </Form>
  );

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: createContent(),
    okType: 'danger',
    cancelText: t('common:no'),
    onCancel,
    onOk: close => {
      handleConfirmPassword(passwordValue).then(isConfirmed => isConfirmed && close());
      return true;
    },
    okText: t('common:yes'),
    okButtonProps: {
      disabled: !passwordValue?.length
    }
  });

  dialog = confirm(createDialogProps());
}
