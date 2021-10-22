import { ROLE } from './role';
import sut from './permissions';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    const user = {
      roles: [ROLE.superUser]
    };

    const permissions = Object.entries(sut)
      .filter(entry => (/^[A-Z_]+$/).test(entry[0]))
      .map(entry => entry[1]);

    permissions.forEach(permission => {
      let result;
      beforeEach(() => {
        result = sut.hasUserPermission(user, permission);
      });
      it(`should be true for user in role '${ROLE.superUser}' and permission '${permission}'`, () => {
        expect(result).toBe(true);
      });
    });

  });

});
