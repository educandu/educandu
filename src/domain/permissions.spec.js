import { ROLE } from './role.js';
import { exportUser, roomResourceAutorizationUser } from './built-in-users.js';
import permissions, { hasUserPermission } from './permissions.js';

const isTechnicalPermission = permission => [permissions.AUTORIZE_ROOMS_RESOURCES, permissions.MANAGE_EXPORT].includes(permission);

describe('permissions', () => {

  describe('hasUserPermission', () => {

    describe('when user has role "admin"', () => {
      const adminUser = {
        roles: [ROLE.admin]
      };

      Object.values(permissions).forEach(permission => {
        let result;
        let expected;
        beforeEach(() => {
          result = hasUserPermission(adminUser, permission);
          expected = !isTechnicalPermission(permission);
        });
        it(`should be ${expected} for permission '${permission}'`, () => {
          expect(result).toBe(expected);
        });
      });

    });

    describe('when user is builtin user "export"', () => {
      const adminUser = exportUser;

      Object.values(permissions).forEach(permission => {
        let result;
        let expected;
        beforeEach(() => {
          result = hasUserPermission(adminUser, permission);
          expected = permission === permissions.MANAGE_EXPORT;
        });
        it(`should be ${expected} for permission '${permission}'`, () => {
          expect(result).toBe(expected);
        });
      });

    });

    describe('when user is builtin user "roomResourceAutorizationUser"', () => {
      const user = roomResourceAutorizationUser;

      Object.values(permissions).forEach(permission => {
        let result;
        let expected;
        beforeEach(() => {
          result = hasUserPermission(user, permission);
          expected = permission === permissions.AUTORIZE_ROOMS_RESOURCES;
        });
        it(`should be ${expected} for permission '${permission}'`, () => {
          expect(result).toBe(expected);
        });
      });

    });

  });

});
