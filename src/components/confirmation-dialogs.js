import React from 'react';
import { Modal, Input, Checkbox } from 'antd';

const confirm = Modal.confirm;
const TextArea = Input.TextArea;

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

export function confirmSectionHardDelete(t, section, onOk, onCancel = () => {}) {
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
        <b className="u-danger">{t('confirmationDialogs:thisActionIsIrreversible')}</b>
        <br />
        <br />
        <span>{t('confirmationDialogs:pleaseSpecifyAReason')}:</span>
        <br />
        <TextArea value={deletionReason} onChange={handleDeletionReasonChange} />
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

export function confirmDocumentRevisionRestoration(t, revision, onOk, onCancel = () => {}) {
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
    content: t('confirmationDialogs:restoreDocumentRevisionConfirmation', { revisionId: revision._id }),
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
