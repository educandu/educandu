import { ROLE } from './role.js';
import { exchangeUser } from './built-in-users.js';
import permissions, { hasUserPermission } from './permissions.js';

const isTechnicalPermission = permission => permission === permissions.LIST_EXPORTABLE_CONTENT;

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

    describe('when user is builtin user "exchange"', () => {
      const adminUser = exchangeUser;

      Object.values(permissions).forEach(permission => {
        let result;
        let expected;
        beforeEach(() => {
          result = hasUserPermission(adminUser, permission);
          expected = isTechnicalPermission(permission);
        });
        it(`should be ${expected} for permission '${permission}'`, () => {
          expect(result).toBe(expected);
        });
      });

    });

  });

});
