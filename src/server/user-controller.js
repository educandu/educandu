import express from 'express';
import passport from 'passport';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import passportLocal from 'passport-local';
import urlUtils from '../utils/url-utils.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import passportSaml from '@node-saml/passport-saml';
import requestUtils from '../utils/request-utils.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import RoomService from '../services/room-service.js';
import PageRenderer from '../server/page-renderer.js';
import ServerConfig from '../bootstrap/server-config.js';
import rateLimit from '../domain/rate-limit-middleware.js';
import StorageService from '../services/storage-service.js';
import SamlConfigService from '../services/saml-config-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ExternalAccountService from '../services/external-account-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import RequestLimitRecordService from '../services/request-limit-record-service.js';
import PasswordResetRequestService from '../services/password-reset-request-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { ANTI_BRUTE_FORCE_MAX_REQUESTS, ANTI_BRUTE_FORCE_EXPIRES_IN_MS, SAVE_USER_RESULT, ERROR_CODES } from '../domain/constants.js';
import {
  postUserRegistrationRequestBodySchema,
  postUserRegistrationCompletionBodySchema,
  postUserAccountBodySchema,
  postUserProfileBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserAccountLockedOnBodySchema,
  postUserStoragePlanBodySchema,
  userIdParamsSchema,
  favoriteBodySchema,
  loginBodySchema,
  externalAccountIdParamsSchema,
  getUsersBySearchQuerySchema,
  postUserNotificationSettingsBodySchema
} from '../domain/schemas/user-schemas.js';

const jsonParser = express.json();
const { MultiSamlStrategy } = passportSaml;
const { Strategy: LocalStrategy } = passportLocal;
const { NotFound, Forbidden, BadRequest } = httpErrors;

const SYMBOL_IDP_KEY = Symbol('SYMBOL_IDP_KEY');
const SYMBOL_REDIRECT_AFTER_SAML_LOGIN = Symbol('SYMBOL_REDIRECT_AFTER_SAML_LOGIN');

class UserController {
  static dependencies = [
    ServerConfig,
    UserService,
    StorageService,
    PasswordResetRequestService,
    RequestLimitRecordService,
    ExternalAccountService,
    MailService,
    ClientDataMappingService,
    RoomService,
    PageRenderer,
    SamlConfigService
  ];

  constructor(
    serverConfig,
    userService,
    storageService,
    passwordResetRequestService,
    requestLimitRecordService,
    externalAccountService,
    mailService,
    clientDataMappingService,
    roomService,
    pageRenderer,
    samlConfigService
  ) {
    this.userService = userService;
    this.mailService = mailService;
    this.roomService = roomService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.storageService = storageService;
    this.samlConfigService = samlConfigService;
    this.externalAccountService = externalAccountService;
    this.clientDataMappingService = clientDataMappingService;
    this.requestLimitRecordService = requestLimitRecordService;
    this.passwordResetRequestService = passwordResetRequestService;

    this.antiBruteForceRequestLimitOptions = {
      maxRequests: ANTI_BRUTE_FORCE_MAX_REQUESTS,
      expiresInMs: ANTI_BRUTE_FORCE_EXPIRES_IN_MS,
      service: this.requestLimitRecordService
    };

    this.localStrategy = new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, (email, password, cb) => {
      this.userService.findConfirmedActiveUserByEmailAndPassword({ email, password, throwIfLocked: true })
        .then(user => cb(null, user || false))
        .catch(err => cb(err));
    });

    this.samlStrategy = new MultiSamlStrategy({
      getSamlOptions: (req, done) => {
        const { redirect } = req.query;
        const provider = this.getProviderForRequest(req);
        const { origin } = requestUtils.getHostInfo(req);
        done(null, {
          providerName: this.serverConfig.appName,
          issuer: `${origin}/saml-auth/id/${provider.key}`,
          entryPoint: provider.resolvedMetadata.entryPoint,
          cert: provider.resolvedMetadata.certificates,
          callbackUrl: urlUtils.concatParts(origin, routes.getSamlAuthLoginCallbackPath(provider.key)),
          decryptionPvk: this.serverConfig.samlAuth.decryption.pvk,
          wantAssertionsSigned: false,
          forceAuthn: true,
          identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
          additionalParams: {
            RelayState: redirect || ''
          }
        });
      }
    }, (profile, done) => done(null, { ...profile }));

    passport.use('local', this.localStrategy);
    passport.use('saml', this.samlStrategy);

    passport.serializeUser((user, cb) => {
      cb(null, { _id: user._id });
    });

    passport.deserializeUser(async (input, cb) => {
      try {
        const user = await this.userService.getUserById(input._id);
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    });
  }

  setIdpKeyFromRequestParam(paramName, req, _res, next) {
    const idpKey = req.params[paramName] || '';
    const provider = this.samlConfigService.getIdentityProviderByKey(idpKey);
    if (!provider) {
      return next(new NotFound('Invalid identity provider key'));
    }

    req[SYMBOL_IDP_KEY] = idpKey;
    return next();
  }

  getProviderForRequest(req) {
    const idpKey = req[SYMBOL_IDP_KEY];
    return this.samlConfigService.getIdentityProviderByKey(idpKey);
  }

  handleGetRegisterPage(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect(routes.getDefaultLoginRedirectUrl());
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.register, {});
  }

  handleGetLoginPage(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect(routes.getDefaultLoginRedirectUrl());
    }

    const samlIdentityProviders = this.samlConfigService.getIdentityProviders()
      .map(provider => this.clientDataMappingService.mapSamlIdentityProvider(provider));

    const initialState = { samlIdentityProviders };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.login, initialState);
  }

  async handleGetLogoutPage(req, res) {
    if (req.isAuthenticated()) {
      const logout = () => new Promise((resolve, reject) => {
        req.logout(err => err ? reject(err) : resolve());
      });

      await logout();
      res.clearCookie(this.serverConfig.sessionCookieName);
    }

    return res.redirect(routes.getDefaultLogoutRedirectUrl());
  }

  handleGetResetPasswordPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.resetPassword, {});
  }

  async handleGetCompletePasswordResetPage(req, res) {
    const resetRequest = await this.passwordResetRequestService.getRequestById(req.params.passwordResetRequestId);
    const passwordResetRequestId = (resetRequest || {})._id;
    const initialState = { passwordResetRequestId };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completePasswordReset, initialState);
  }

  handleGetConnectExternalAccountPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.connectExternalAccount, {});
  }

  async handleGetUserProfilePage(req, res) {
    const { userId } = req.params;
    const viewingUser = req.user;

    const viewedUser = await this.userService.getUserById(userId);
    if (!viewedUser) {
      throw new NotFound();
    }

    const mappedViewedUser = this.clientDataMappingService.mapWebsitePublicUser({ viewedUser, viewingUser });

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.userProfile, { user: mappedViewedUser });
  }

  async handleGetUsers(req, res) {
    const users = await this.userService.getAllUsers();
    const mappedUsers = this.clientDataMappingService.mapUsersForAdminArea(users);
    res.send({ users: mappedUsers });
  }

  async handleGetUsersBySearch(req, res) {
    const { query } = req.query;
    const viewingUser = req.user;

    const users = await this.userService.getActiveUsersBySearch({ query, limit: 10 });
    const mappedUsers = users.map(viewedUser => this.clientDataMappingService.mapWebsitePublicUser({ viewedUser, viewingUser }));
    res.send({ users: mappedUsers });
  }

  async handleGetExternalUserAccounts(_req, res) {
    const externalAccounts = await this.externalAccountService.getAllExternalAccounts();
    const mappedExternalAccounts = this.clientDataMappingService.mapExternalAccountsForAdminArea(externalAccounts);
    res.send({ externalAccounts: mappedExternalAccounts });
  }

  async handleDeleteExternalUserAccount(req, res) {
    const { externalAccountId } = req.params;
    await this.externalAccountService.deleteExternalAccount({ externalAccountId });
    res.status(204).end();
  }

  async handlePostUserRegistrationRequest(req, res) {
    const { email, password, displayName } = req.body;

    const { result, user } = await this.userService.createUser({ email, password, displayName });

    if (result === SAVE_USER_RESULT.success) {
      await this.mailService.sendRegistrationVerificationEmail({ email, displayName, verificationCode: user.verificationCode });
    }

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserRegistrationCompletion(req, res) {
    const { userId, verificationCode } = req.body;

    const user = await this.userService.verifyUser(userId, verificationCode);
    if (!user) {
      throw new NotFound();
    }

    const connectedExternalAccountId = req.session.externalAccount?._id || null;
    req.session.externalAccount = null;

    if (connectedExternalAccountId) {
      await this.externalAccountService.updateExternalAccountUserId({
        externalAccountId: connectedExternalAccountId,
        userId: user._id
      });
    }

    const updatedUser = await this.userService.recordUserLogIn(user._id);
    await new Promise((resolve, reject) => {
      req.login(updatedUser, err => err ? reject(err) : resolve());
    });

    res.status(201).send({
      user: this.clientDataMappingService.mapWebsiteUser(updatedUser),
      connectedExternalAccountId: user ? connectedExternalAccountId : null
    });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const { email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, email });

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { displayName, organization, introduction } = req.body;
    const updatedUser = await this.userService.updateUserProfile({ userId, displayName, organization, introduction });

    if (!updatedUser) {
      throw new NotFound();
    }

    res.status(201).send({ user: this.clientDataMappingService.mapWebsiteUser(updatedUser) });
  }

  async handlePostUserNotificationSettings(req, res) {
    const userId = req.user._id;
    const { emailNotificationFrequency } = req.body;
    const updatedUser = await this.userService.updateUserNotificationSettings({ userId, emailNotificationFrequency });

    if (!updatedUser) {
      throw new NotFound();
    }

    res.status(201).send({ user: this.clientDataMappingService.mapWebsiteUser(updatedUser) });
  }

  async handlePostUserLogin(req, res, next) {
    try {
      const user = await new Promise((resolve, reject) => {
        passport.authenticate('local', (err, usr) => {
          return err ? reject(err) : resolve(usr);
        })(req, res, next);
      });

      if (!user) {
        return res.status(201).send({ user: null });
      }

      const updatedUser = await this.userService.recordUserLogIn(user._id);

      const connectedExternalAccountId = req.session.externalAccount?._id || null;
      req.session.externalAccount = null;

      if (req.body.connectExternalAccount) {
        await this.externalAccountService.updateExternalAccountUserId({
          externalAccountId: connectedExternalAccountId,
          userId: updatedUser._id
        });
      }

      await new Promise((resolve, reject) => {
        req.login(updatedUser, err => err ? reject(err) : resolve());
      });

      return res.status(201).send({
        user: this.clientDataMappingService.mapWebsiteUser(updatedUser),
        connectedExternalAccountId
      });
    } catch (error) {
      return next(error);
    }
  }

  handleDeleteAbortExternalAccountConnection(req, res) {
    if (!req.session.externalAccount) {
      throw new BadRequest();
    }

    delete req.session.externalAccount;
    return res.status(204).end();
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email, password } = req.body;
    const user = await this.userService.getActiveUserByEmailAddress(email);

    let createdRequest;
    if (user) {
      createdRequest = await this.userService.createPasswordResetRequest(user, password);
      await this.mailService.sendPasswordResetEmail({
        email: user.email,
        displayName: user.displayName,
        verificationCode: createdRequest.verificationCode
      });
    }

    res.status(201).send({ passwordResetRequestId: createdRequest?._id });
  }

  async handlePostUserPasswordResetCompletion(req, res) {
    const { passwordResetRequestId, verificationCode } = req.body;
    const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, verificationCode);

    if (!user) {
      throw new NotFound();
    }

    const updatedUser = await this.userService.recordUserLogIn(user._id);
    await new Promise((resolve, reject) => {
      req.login(updatedUser, err => err ? reject(err) : resolve());
    });

    res.status(201).send({
      user: this.clientDataMappingService.mapWebsiteUser(updatedUser)
    });
  }

  async handlePostUserRoles(req, res) {
    const { userId } = req.params;
    const { roles } = req.body;
    const newRoles = await this.userService.updateUserRoles(userId, roles);
    return res.status(201).send({ roles: newRoles });
  }

  async handlePostUserAccountLockedOn(req, res) {
    const { userId } = req.params;
    const { accountLockedOn } = req.body;
    const accountLockedOnDate = accountLockedOn ? new Date(accountLockedOn) : null;

    if (isNaN(accountLockedOnDate)) {
      throw new BadRequest(`'${accountLockedOn}' is not a valid date string.`);
    }

    const updatedUser = await this.userService.updateUserAccountLockedOn(userId, accountLockedOnDate);
    const mappedUser = this.clientDataMappingService.mapUserForAdminArea(updatedUser);

    return res.status(201).send(mappedUser);
  }

  async handlePostUserStoragePlan(req, res) {
    const { userId } = req.params;
    const { storagePlanId } = req.body;
    const newStorage = await this.userService.updateUserStoragePlan(userId, storagePlanId);
    return res.status(201).send(newStorage);
  }

  async handlePostUserStorageReminder(req, res) {
    const { user } = req;
    const { userId } = req.params;
    const newStorage = await this.userService.addUserStorageReminder(userId, user);
    return res.status(201).send(newStorage);
  }

  async handleDeleteAllUserStorageReminders(req, res) {
    const { userId } = req.params;
    const newStorage = await this.userService.deleteAllUserStorageReminders(userId);
    return res.send(newStorage);
  }

  async handleGetFavorites(req, res) {
    const { user } = req;
    const favorites = await this.userService.getFavorites({ user });

    const mappedFavorites = await this.clientDataMappingService.mapUserFavorites(favorites, user);
    return res.send({ favorites: mappedFavorites });
  }

  async handlePostFavorite(req, res) {
    const { user } = req;
    const { type, id } = req.body;
    const updatedUser = await this.userService.addFavorite({ type, id, user });
    return res.status(201).send(this.clientDataMappingService.mapWebsiteUser(updatedUser));
  }

  async handleDeleteFavorite(req, res) {
    const { user } = req;
    const { type, id } = req.body;
    const updatedUser = await this.userService.deleteFavorite({ type, id, user });
    return res.send(this.clientDataMappingService.mapWebsiteUser(updatedUser));
  }

  async handleGetActivities(req, res) {
    const { user } = req;
    const activities = await this.userService.getActivities({ userId: user._id, limit: 25 });

    const mappedActivities = await this.clientDataMappingService.mapUserActivities(activities);
    return res.send({ activities: mappedActivities });
  }

  async handleGetRoomsInvitations(req, res) {
    const { user } = req;
    const invitations = await this.roomService.getRoomInvitationsByEmail(user.email);
    const mappedInvitations = await Promise.all(invitations.map(invitation => this.clientDataMappingService.mapUserOwnRoomInvitations(invitation)));

    return res.send({ invitations: mappedInvitations });
  }

  async handleCloseUserAccount(req, res) {
    const { user } = req;
    const { userId } = req.params;

    if (user._id !== userId) {
      throw new Forbidden();
    }

    const userRooms = await this.roomService.getRoomsOwnedByUser(userId);
    for (const room of userRooms) {
      await this.storageService.deleteRoomAndResources({ roomId: room._id, roomOwnerId: userId });
    }
    await this.roomService.removeMembershipFromAllRoomsForUser(userId);
    await this.userService.closeUserAccount(userId);

    return res.status(204).end();
  }

  registerMiddleware(router) {
    router.use(passport.initialize());

    router.use(passport.session());

    router.get(
      '/saml-auth/metadata/:idpKey',
      (req, res, next) => this.setIdpKeyFromRequestParam('idpKey', req, res, next),
      (req, res, next) => {
        this.samlStrategy.generateServiceProviderMetadata(req, this.serverConfig.samlAuth.decryption.cert, null, (err, metadata) => {
          return err ? next(err) : res.set('content-type', 'text/xml').send(metadata);
        });
      }
    );

    router.get(
      '/saml-auth/login/:idpKey',
      (req, res, next) => this.setIdpKeyFromRequestParam('idpKey', req, res, next),
      (req, res, next) => {
        passport.authenticate('saml', err => err ? next(err) : res.end())(req, res, next);
      }
    );

    router.post(
      '/saml-auth/login-callback/:idpKey',
      express.urlencoded({ extended: false }),
      (req, res, next) => this.setIdpKeyFromRequestParam('idpKey', req, res, next),
      (req, res, next) => {
        passport.authenticate('saml', async (err, profile) => {
          if (err) {
            return next(err);
          }

          if (!profile) {
            return next(new Error('No profile was sent by identity provider'));
          }

          const providerKey = this.getProviderForRequest(req).key;
          const externalUserId = profile.nameID;
          const { RelayState } = req.body;

          try {
            // eslint-disable-next-line require-atomic-updates
            req[SYMBOL_REDIRECT_AFTER_SAML_LOGIN] = RelayState || null;
            // eslint-disable-next-line require-atomic-updates
            req.session.externalAccount = await this.externalAccountService
              .createOrUpdateExternalAccountOnLogin({ providerKey, externalUserId });
          } catch (error) {
            return next(error);
          }

          return next();
        })(req, res, next);
      }
    );

    router.use(async (req, res, next) => {
      const { externalAccount } = req.session;

      if (
        !externalAccount
        || routes.isApiPath(req.originalUrl)
        || routes.isResetPasswordPath(req.originalUrl)
        || routes.isConnectExternalAccountPath(req.originalUrl)
      ) {
        return next();
      }

      const redirect = req[SYMBOL_REDIRECT_AFTER_SAML_LOGIN] || null;

      if (!externalAccount.userId) {
        return res.redirect(routes.getConnectExternalAccountPath(redirect));
      }

      try {
        const user = await this.userService.findConfirmedActiveUserById({ userId: externalAccount.userId, throwIfLocked: true });
        if (!user) {
          // eslint-disable-next-line require-atomic-updates
          req.session.externalAccount = await this.externalAccountService.updateExternalAccountUserId({
            externalAccountId: externalAccount._id,
            userId: null
          });
          return res.redirect(routes.getConnectExternalAccountPath(redirect));
        }

        const updatedUser = await this.userService.recordUserLogIn(user._id);
        await new Promise((resolve, reject) => {
          req.login(updatedUser, err => err ? reject(err) : resolve());
        });

        delete req.session.externalAccount;
        return res.redirect(redirect ? redirect : routes.getHomeUrl());
      } catch (err) {
        if (err.code === ERROR_CODES.userAccountLocked) {
          delete req.session.externalAccount;
        }

        return next(err);
      }
    });
  }

  registerPages(router) {
    router.get('/user-profile/:userId', (req, res) => this.handleGetUserProfilePage(req, res));

    router.get('/register', (req, res) => this.handleGetRegisterPage(req, res));

    router.get('/reset-password', (req, res) => this.handleGetResetPasswordPage(req, res));

    router.get('/login', (req, res) => this.handleGetLoginPage(req, res));

    router.get('/logout', (req, res) => this.handleGetLogoutPage(req, res));

    router.get('/connect-external-account', (req, res) => this.handleGetConnectExternalAccountPage(req, res));
  }

  registerApi(router) {
    router.get(
      '/api/v1/users',
      needsPermission(permissions.MANAGE_USERS),
      (req, res) => this.handleGetUsers(req, res)
    );

    router.get(
      '/api/v1/users/search',
      needsPermission(permissions.VIEW_USERS),
      validateQuery(getUsersBySearchQuerySchema),
      (req, res) => this.handleGetUsersBySearch(req, res)
    );

    router.get(
      '/api/v1/users/external-accounts',
      needsPermission(permissions.MANAGE_USERS),
      (req, res) => this.handleGetExternalUserAccounts(req, res)
    );

    router.delete(
      '/api/v1/users/external-accounts/:externalAccountId',
      needsPermission(permissions.MANAGE_USERS),
      validateParams(externalAccountIdParamsSchema),
      (req, res) => this.handleDeleteExternalUserAccount(req, res)
    );

    router.post(
      '/api/v1/users/request-registration',
      jsonParser,
      validateBody(postUserRegistrationRequestBodySchema),
      (req, res) => this.handlePostUserRegistrationRequest(req, res)
    );

    router.post(
      '/api/v1/users/complete-registration',
      jsonParser,
      validateBody(postUserRegistrationCompletionBodySchema),
      (req, res) => this.handlePostUserRegistrationCompletion(req, res)
    );

    router.post(
      '/api/v1/users/request-password-reset',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(postUserPasswordResetRequestBodySchema),
      (req, res) => this.handlePostUserPasswordResetRequest(req, res)
    );

    router.post(
      '/api/v1/users/complete-password-reset',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(postUserPasswordResetCompletionBodySchema),
      (req, res) => this.handlePostUserPasswordResetCompletion(req, res)
    );

    router.post(
      '/api/v1/users/account',
      needsAuthentication(),
      jsonParser,
      validateBody(postUserAccountBodySchema),
      (req, res) => this.handlePostUserAccount(req, res)
    );

    router.post(
      '/api/v1/users/profile',
      needsAuthentication(),
      jsonParser,
      validateBody(postUserProfileBodySchema),
      (req, res) => this.handlePostUserProfile(req, res)
    );

    router.post(
      '/api/v1/users/notification-settings',
      needsAuthentication(),
      jsonParser,
      validateBody(postUserNotificationSettingsBodySchema),
      (req, res) => this.handlePostUserNotificationSettings(req, res)
    );

    router.post(
      '/api/v1/users/login',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(loginBodySchema),
      (req, res, next) => this.handlePostUserLogin(req, res, next)
    );

    router.delete(
      '/api/v1/users/abort-external-account-connection',
      (req, res, next) => this.handleDeleteAbortExternalAccountConnection(req, res, next)
    );

    router.post(
      '/api/v1/users/:userId/roles',
      needsPermission(permissions.MANAGE_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserRolesBodySchema),
      (req, res) => this.handlePostUserRoles(req, res)
    );

    router.post(
      '/api/v1/users/:userId/accountLockedOn',
      needsPermission(permissions.MANAGE_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserAccountLockedOnBodySchema),
      (req, res) => this.handlePostUserAccountLockedOn(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storagePlan',
      needsPermission(permissions.MANAGE_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserStoragePlanBodySchema),
      (req, res) => this.handlePostUserStoragePlan(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storageReminders',
      needsPermission(permissions.MANAGE_USERS),
      validateParams(userIdParamsSchema),
      (req, res) => this.handlePostUserStorageReminder(req, res)
    );

    router.delete(
      '/api/v1/users/:userId/storageReminders',
      needsPermission(permissions.MANAGE_USERS),
      validateParams(userIdParamsSchema),
      (req, res) => this.handleDeleteAllUserStorageReminders(req, res)
    );

    router.get(
      '/api/v1/users/favorites',
      needsAuthentication(),
      (req, res) => this.handleGetFavorites(req, res)
    );

    router.post(
      '/api/v1/users/favorites',
      needsAuthentication(),
      jsonParser,
      validateBody(favoriteBodySchema),
      (req, res) => this.handlePostFavorite(req, res)
    );

    router.delete(
      '/api/v1/users/favorites',
      needsAuthentication(),
      jsonParser,
      validateBody(favoriteBodySchema),
      (req, res) => this.handleDeleteFavorite(req, res)
    );

    router.get(
      '/api/v1/users/activities',
      needsAuthentication(),
      (req, res) => this.handleGetActivities(req, res)
    );

    router.get(
      '/api/v1/users/rooms-invitations',
      needsAuthentication(),
      (req, res) => this.handleGetRoomsInvitations(req, res)
    );

    router.delete(
      '/api/v1/users/:userId',
      needsAuthentication(),
      validateParams(userIdParamsSchema),
      (req, res) => this.handleCloseUserAccount(req, res)
    );
  }
}

export default UserController;
