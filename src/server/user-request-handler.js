import passport from 'passport';
import urls from '../utils/urls.js';
import PageRenderer from '../server/page-renderer.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import requestHelper from '../utils/request-helper.js';
import ClientDataMapper from './client-data-mapper.js';
import { SAVE_USER_RESULT } from '../domain/user-management.js';

class UserRequestHandler {
  static get inject() { return [UserService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(userService, mailService, clientDataMapper, pageRenderer) {
    this.userService = userService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  handleGetRegisterPage(req, res) {
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'register', {});
  }

  handleGetResetPasswordPage(req, res) {
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'reset-password', {});
  }

  async handleCompleteRegistrationPage(req, res) {
    const user = await this.userService.verifyUser(req.params.verificationCode);
    const initialState = { user };
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'complete-registration', initialState);
  }

  handleGetLoginPage(req, res) {
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'login', {});
  }

  handleGetLogoutPage(req, res) {
    req.logout();
    return res.redirect(urls.getDefaultLogoutRedirectUrl());
  }

  handleGetAccountPage(req, res) {
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'account', {});
  }

  async handleGetCompletePasswordResetPage(req, res) {
    const resetRequest = await this.userService.getPasswordResetRequestById(req.params.passwordResetRequestId);
    const passwordResetRequestId = (resetRequest || {})._id;
    const initialState = { passwordResetRequestId };
    return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'complete-password-reset', initialState);
  }

  async handleGetUsersPage(req, res) {
    const initialState = await this.userService.getAllUsers();
    return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'users', initialState);
  }

  async handleGetUsers(req, res) {
    const result = await this.userService.getAllUsers();
    res.send({ users: result });
  }

  async handlePostUser(req, res) {
    const { username, password, email } = req.body;

    const { result, user } = await this.userService.createUser({ username, password, email });

    if (result === SAVE_USER_RESULT.success) {
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationLink({ username, email, verificationLink });
    }

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const { username, email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, username, email });

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { profile } = req.body;
    const savedProfile = await this.userService.updateUserProfile(userId, profile);
    if (!savedProfile) {
      res.status(404).send('Invalid user id');
      return;
    }

    res.send({ profile: savedProfile });
  }

  handlePostUserLogin(req, res, next) {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.send({ user: null });
      }

      return req.login(user, loginError => {
        if (loginError) {
          return next(loginError);
        }

        return res.send({ user: this.clientDataMapper.dbUserToClientUser(user) });
      });
    })(req, res, next);
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email } = req.body;
    const user = await this.userService.getUserByEmailAddress(email);

    if (user) {
      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestHelper.getHostInfo(req);
      const completionLink = urls.concatParts(origin, urls.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetRequestCompletionLink({ username: user.username, email: user.email, completionLink });
    }

    res.send({});
  }

  async handlePostUserPasswordResetCompletion(req, res) {
    const { passwordResetRequestId, password } = req.body;
    const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    res.send({ user });

  }

  async handlePostUserRoles(req, res) {
    const { userId } = req.params;
    const { roles } = req.body;
    const newRoles = await this.userService.updateUserRoles(userId, roles);
    return res.send({ roles: newRoles });
  }

  async handlePostUserLockedOut(req, res) {
    const { userId } = req.params;
    const { lockedOut } = req.body;
    const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
    return res.send({ lockedOut: newLockedOutState });
  }
}

export default UserRequestHandler;
