import React from 'react';
import { Modal, Input, Checkbox } from 'antd';

const confirm = Modal.confirm;
const TextArea = Input.TextArea;

export function confirmDelete(section, onOk, onCancel = () => {}) {
  confirm({
    title: 'Sind Sie sicher?',
    content: <span>Möchten Sie diesen Abschnitt wirklich löschen?</span>,
    okText: 'Ja',
    okType: 'danger',
    cancelText: 'Nein',
    onOk: onOk,
    onCancel: onCancel
  });
}

export function confirmHardDelete(section, onOk, onCancel = () => {}) {
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
        <span>Möchten Sie den Abschnitt wirklich löschen?</span>
        <br />
        <b className="u-danger">Diese Aktion ist unwiderrufbar!</b>
        <br />
        <br />
        <span>Bitte geben Sie einen Grund an:</span>
        <br />
        <TextArea value={deletionReason} onChange={handleDeletionReasonChange} />
        <br />
        <br />
        <Checkbox
          value={deleteDescendants}
          onChange={handleDeleteDescendantsChange}
          >
          Auch alle nachfolgenden Revisionen löschen
        </Checkbox>
      </div>
    );
  }

  createDialogProps = () => ({
    title: 'Sind Sie sicher?',
    content: createContent(),
    okText: 'Ja',
    okType: 'danger',
    cancelText: 'Nein',
    onOk: () => onOk({ deleteDescendants, deletionReason }),
    onCancel: onCancel,
    okButtonProps: {
      disabled: deletionReason.length < 3
    }
  });

  dialog = confirm(createDialogProps());
}

export default {
  confirmDelete,
  confirmHardDelete
};
