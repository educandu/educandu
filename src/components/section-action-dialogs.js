import React from 'react';
import { Modal, Input, Checkbox } from 'antd';

const confirm = Modal.confirm;
const TextArea = Input.TextArea;

export function confirmSectionDelete(t, section, onOk, onCancel = () => {}) {
  confirm({
    title: t('sectionActionDialogs:areYouSure'),
    content: t('sectionActionDialogs:deleteSectionConfirmation'),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: onOk,
    onCancel: onCancel
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
        {t('sectionActionDialogs:deleteSectionConfirmation')}
        <br />
        <b className="u-danger">{t('sectionActionDialogs:thisActionIsIrreversible')}</b>
        <br />
        <br />
        <span>{t('sectionActionDialogs:pleaseSpecifyAReason')}:</span>
        <br />
        <TextArea value={deletionReason} onChange={handleDeletionReasonChange} />
        <br />
        <br />
        <Checkbox
          value={deleteDescendants}
          onChange={handleDeleteDescendantsChange}
          >
          {t('sectionActionDialogs:deleteAllDescendantRevisions')}
        </Checkbox>
      </div>
    );
  }

  createDialogProps = () => ({
    title: t('sectionActionDialogs:areYouSure'),
    content: createContent(),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: () => onOk({ deleteDescendants, deletionReason }),
    onCancel: onCancel,
    okButtonProps: {
      disabled: deletionReason.length < 3
    }
  });

  dialog = confirm(createDialogProps());
}

export default {
  confirmSectionDelete,
  confirmSectionHardDelete
};
