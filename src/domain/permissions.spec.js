import { ROLE } from './role.js';
import { exchangeUser } from './built-in-users.js';
import sut, { LIST_EXPORTABLE_CONTENT } from './permissions.js';

const allNonTechnicalPermissions = Object.entries(sut)
  .filter(entry => (/^[A-Z_]+$/).test(entry[0]))
  .filter(entry => entry[1] !== LIST_EXPORTABLE_CONTENT)
  .map(entry => entry[1]);

describe('permissions', () => {

  describe('hasUserPermission', () => {

    describe('when user has role "admin"', () => {
      const adminUser = {
        roles: [ROLE.admin]
      };

      allNonTechnicalPermissions.forEach(permission => {
        let result;
        beforeEach(() => {
          result = sut.hasUserPermission(adminUser, permission);
        });
        it(`should be true for permission '${permission}'`, () => {
          expect(result).toBe(true);
        });
      });

      it(`should be false for permission '${LIST_EXPORTABLE_CONTENT}'`, () => {
        expect(sut.hasUserPermission(adminUser, LIST_EXPORTABLE_CONTENT)).toBe(false);
      });

    });

    describe('when user is builtin user "exchange"', () => {
      const adminUser = exchangeUser;

      allNonTechnicalPermissions.forEach(permission => {
        let result;
        beforeEach(() => {
          result = sut.hasUserPermission(adminUser, permission);
        });
        it(`should be false for permission '${permission}'`, () => {
          expect(result).toBe(false);
        });
      });

      it(`should be true for permission '${LIST_EXPORTABLE_CONTENT}'`, () => {
        expect(sut.hasUserPermission(adminUser, LIST_EXPORTABLE_CONTENT)).toBe(true);
      });

    });

  });

});
