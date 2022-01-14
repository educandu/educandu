import { Modal } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useContext, useMemo } from 'react';
import { confirmWithPassword, reloginAfterSessionExpired } from './confirmation-dialogs.js';

const DialogContext = React.createContext();

function createDialogsContextValue(modal, t) {
  return {
    confirmWithPassword: (...args) => confirmWithPassword(modal, t, ...args),
    reloginAfterSessionExpired: (...args) => reloginAfterSessionExpired(modal, t, ...args)
  };
}

export function useDialogs() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }) {
  const { t } = useTranslation();
  const [modal, contextHolder] = Modal.useModal();
  const value = useMemo(() => createDialogsContextValue(modal, t), [modal, t]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {contextHolder}
    </DialogContext.Provider>
  );
}

DialogProvider.propTypes = {
  children: PropTypes.node
};

DialogProvider.defaultProps = {
  children: null
};
