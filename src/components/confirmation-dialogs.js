import LoginForm from './login-form.js';
import React, { createRef } from 'react';
import { Modal, Checkbox, Form } from 'antd';
import NeverScrollingTextArea from './never-scrolling-text-area.js';

const FormItem = Form.Item;
const confirm = Modal.confirm;

export function confirmDiscardUnsavedChanges(t, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:discardUnsavedChanges'),
    okText: t('common:ok'),
    okType: 'danger',
    cancelText: t('common:cancel'),
    onOk,
    onCancel
  });
}

export function confirmSectionDelete(t, onOk, onCancel = () => {}) {
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

export function confirmDocumentDelete(t, documentTitle, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteDocumentConfirmation', { title: documentTitle }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmAllOwnedRoomsDelete(t, ownerName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteAllOwnedRoomsConfirmation', { ownerName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmRoomDelete(t, roomName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteRoomConfirmation', { roomName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmRoomMemberDelete(t, memberDisplayName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteRoomMemberConfirmation', { memberDisplayName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmRoomInvitationDelete(t, invitationEmail, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteRoomInvitationConfirmation', { invitationEmail }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmDelete(t, title, onOk, onCancel = () => { }) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:genericDeleteConfirmation', { title }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmLeaveRoom(t, roomName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:leaveRoomConfirmation', { roomName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmCdnFileDelete(t, fileName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteCdnDocumentConfirmation', { fileName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmSectionHardDelete(
  t,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let createDialogProps = null;
  const formRef = React.createRef();

  const handleOk = () => {
    const reason = formRef.current.getFieldValue('reason');
    const deleteAllRevisions = formRef.current.getFieldValue('deleteAllVersions');
    onOk({ reason, deleteAllRevisions });
  };

  const updateDialog = () => {
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
        <Form ref={formRef}>
          <FormItem name="reason" initialValue="">
            <NeverScrollingTextArea onChange={updateDialog} />
          </FormItem>
          <br />
          <br />
          <FormItem name="deleteAllRevisions" initialValue={false} valuePropName="checked">
            <Checkbox>
              {t('confirmationDialogs:deleteAllVersions')}
            </Checkbox>
          </FormItem>
        </Form>
      </div>
    );
  }

  createDialogProps = () => {
    const isOkDisabled = (formRef?.current?.getFieldValue('reason')?.length || 0) < 3;

    return {
      title: t('confirmationDialogs:areYouSure'),
      content: createContent(),
      okText: t('common:yes'),
      okType: 'danger',
      cancelText: t('common:no'),
      onOk: handleOk,
      onCancel,
      okButtonProps: {
        disabled: isOkDisabled
      }
    };
  };

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
    content: t('confirmationDialogs:restoreDocumentVersionConfirmation', { id: revision._id }),
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

export function confirmStoragePlanDeletion(
  t,
  storagePlan,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let isDeleting = false;
  let createDialogProps = null;

  const handleOkClick = () => {
    isDeleting = true;
    dialog.update(createDialogProps());

    onOk()
      .then(() => {
        isDeleting = false;
        dialog.update(createDialogProps());
        dialog.destroy();
        dialog = null;
      })
      .catch(() => {
        isDeleting = false;
        dialog.update(createDialogProps());
      });

    return true;
  };

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteStoragePlanConfirmation', {
      storagePlanName: storagePlan.name
    }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: handleOkClick,
    onCancel,
    okButtonProps: {
      loading: isDeleting
    }
  });

  dialog = confirm(createDialogProps());
}

export function reloginAfterSessionExpired(modal, t, onOk, onCancel) {
  const formRef = createRef();

  let dialog = null;
  let isLoggingIn = false;
  let isLoginBlocked = false;
  let createDialogProps = null;

  const handleLoginStarted = () => {
    isLoggingIn = true;
    dialog.update(createDialogProps());
  };

  const handleLoginSucceeded = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
    dialog.destroy();
    dialog = null;
    onOk();
  };

  const handleLoginFailed = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
  };

  const handleLoginBlocked = () => {
    isLoginBlocked = true;
    dialog.update(createDialogProps());
  };

  const handleOkClick = () => {
    formRef.current.submit();
    return true;
  };

  function createContent() {
    return (
      <div>
        <p>{t('confirmationDialogs:sessionExpiredDescription')}</p>
        <LoginForm
          formRef={formRef}
          name="session-expired-login-form"
          onLoginFailed={handleLoginFailed}
          onLoginStarted={handleLoginStarted}
          onLoginSucceeded={handleLoginSucceeded}
          onLoginBlocked={handleLoginBlocked}
          />
      </div>
    );
  }

  createDialogProps = () => ({
    title: t('confirmationDialogs:sessionExpiredTitle'),
    content: createContent(),
    okText: t('common:logIn'),
    cancelText: t('common:cancel'),
    onOk: handleOkClick,
    onCancel,
    okButtonProps: {
      loading: isLoggingIn,
      disabled: isLoginBlocked
    }
  });

  dialog = modal.confirm(createDialogProps());
}

export function confirmWithPassword(modal, t, email, onOk, onCancel = () => {}) {
  const formRef = createRef();

  let dialog = null;
  let isLoggingIn = false;
  let isLoginBlocked = false;
  let createDialogProps = null;

  const handleLoginStarted = () => {
    isLoggingIn = true;
    dialog.update(createDialogProps());
  };

  const handleLoginSucceeded = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
    dialog.destroy();
    dialog = null;
    onOk();
  };

  const handleLoginFailed = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
  };

  const handleLoginBlocked = () => {
    isLoginBlocked = true;
    dialog.update(createDialogProps());
  };

  const handleOkClick = () => {
    formRef.current.submit();
    return true;
  };

  const createContent = () => (
    <div>
      <p>{t('confirmationDialogs:confirmWithPasswordDescription')}</p>
      <LoginForm
        formRef={formRef}
        fixedEmail={email}
        name="confirmation-login-form"
        onLoginFailed={handleLoginFailed}
        onLoginStarted={handleLoginStarted}
        onLoginSucceeded={handleLoginSucceeded}
        onLoginBlocked={handleLoginBlocked}
        />
    </div>
  );

  createDialogProps = () => ({
    title: t('confirmationDialogs:confirmWithPasswordTitle'),
    content: createContent(),
    cancelText: t('common:cancel'),
    onCancel,
    onOk: handleOkClick,
    okText: t('common:confirm'),
    okButtonProps: {
      loading: isLoggingIn,
      disabled: isLoginBlocked
    }
  });

  dialog = modal.confirm(createDialogProps());
}

export function confirmDeleteItem(t, name, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteItemConfirmation', { name }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmPublicUploadLiability(t, onOk, onCancel = () => { }) {
  confirm({
    title: t('confirmationDialogs:attention'),
    content: t('confirmationDialogs:confirmPublicUploadLiability'),
    okText: t('common:ok'),
    okType: 'danger',
    cancelText: t('common:cancel'),
    onOk,
    onCancel
  });
}

export function confirmCloseAccount(t, onOk, onCancel = () => { }) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:closeAccountConfirmation'),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmExitFileEditor(t, onOk, onCancel = () => { }) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:exitFileEditor'),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmCommentDelete(t, author, timestamp, onOk, onCancel = () => { }) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteCommentConfirmation', { author, timestamp }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}
