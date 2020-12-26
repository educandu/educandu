import roles from './roles';
import sut from './permissions';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    const user = {
      roles: [roles.SUPER_USER]
    };

    const permissions = Object.entries(sut)
      .filter(entry => (/^[A-Z_]+$/).test(entry[0]))
      .map(entry => entry[1]);

    permissions.forEach(permission => {
      let result;
      beforeEach(() => {
        result = sut.hasUserPermission(user, permission);
      });
      it(`should be true for user in role '${roles.SUPER_USER}' and permission '${permission}'`, () => {
        expect(result).toBe(true);
      });
    });

  });

});
