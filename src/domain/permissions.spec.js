import { ROLE } from './role.js';
import sut from './permissions.js';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    const user = {
      roles: [ROLE.admin]
    };

    const permissions = Object.entries(sut)
      .filter(entry => (/^[A-Z_]+$/).test(entry[0]))
      .map(entry => entry[1]);

    permissions.forEach(permission => {
      let result;
      beforeEach(() => {
        result = sut.hasUserPermission(user, permission);
      });
      it(`should be true for user in role '${ROLE.admin}' and permission '${permission}'`, () => {
        expect(result).toBe(true);
      });
    });

  });

});
