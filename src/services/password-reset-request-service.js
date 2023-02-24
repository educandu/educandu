import PasswordResetRequestStore from '../stores/password-reset-request-store.js';

class PasswordResetRequestService {
  static dependencies = [PasswordResetRequestStore];

  constructor(passwordResetRequestStore) {
    this.passwordResetRequestStore = passwordResetRequestStore;
  }

  getRequestById(id) {
    return this.passwordResetRequestStore.getRequestById(id);
  }
}

export default PasswordResetRequestService;
