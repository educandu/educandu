import { ROLE } from './role.js';
import sut, { LIST_EXPORTABLE_CONTENT } from './permissions.js';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    const user = {
      roles: [ROLE.admin]
    };

    const permissions = Object.entries(sut)
      .filter(entry => (/^[A-Z_]+$/).test(entry[0]))
      .filter(entry => entry[1] !== LIST_EXPORTABLE_CONTENT)
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
