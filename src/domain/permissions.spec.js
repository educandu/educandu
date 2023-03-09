import { ROLE } from './constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import permissions, { hasUserPermission, getAllUserPermissions } from './permissions.js';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    let result;
    let expected;

    describe('when user has role "admin"', () => {
      const adminUser = { roles: [ROLE.admin] };

      Object.values(permissions).forEach(permission => {
        beforeEach(() => {
          result = hasUserPermission(adminUser, permission);
        });
        it(`should be ${expected} for permission '${permission}'`, () => {
          expect(result).toBe(true);
        });
      });
    });
  });

  describe('getAllUserPermissions', () => {
    let result;

    describe('when user has no direct permissions or roles', () => {
      beforeEach(() => {
        const user = { permissions: [], roles: [] };
        result = getAllUserPermissions(user);
      });
      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when user has role \'user\'', () => {
      beforeEach(() => {
        const user = { roles: [ROLE.user] };
        result = getAllUserPermissions(user);
      });
      it('should return all user permissions', () => {
        expect(result).toEqual([
          permissions.CREATE_CONTENT,
          permissions.BROWSE_STORAGE,
          permissions.DELETE_OWN_PRIVATE_CONTENT
        ]);
      });
    });

    describe('when user has role \'accreditedAuthor\'', () => {
      beforeEach(() => {
        const user = { roles: [ROLE.accreditedAuthor] };
        result = getAllUserPermissions(user);
      });
      it('should return all user permissions', () => {
        expect(result).toEqual([
          permissions.CREATE_CONTENT,
          permissions.BROWSE_STORAGE,
          permissions.DELETE_OWN_PRIVATE_CONTENT,
          permissions.PROTECT_OWN_PUBLIC_CONTENT
        ]);
      });
    });

    describe('when user has role \'maintainer\'', () => {
      beforeEach(() => {
        const user = { roles: [ROLE.maintainer] };
        result = getAllUserPermissions(user);
      });

      it('should return all maintainer permissions', () => {
        expect(result).toEqual([
          permissions.CREATE_CONTENT,
          permissions.BROWSE_STORAGE,
          permissions.DELETE_OWN_PRIVATE_CONTENT,
          permissions.PROTECT_OWN_PUBLIC_CONTENT,
          permissions.VIEW_USERS,
          permissions.MANAGE_PUBLIC_CONTENT
        ]);
      });
    });

    describe('when user has role \'admin\'', () => {
      beforeEach(() => {
        const user = { roles: [ROLE.admin] };
        result = getAllUserPermissions(user);
      });

      it('should return all user permissions', () => {
        expect(result).toEqual([
          permissions.CREATE_CONTENT,
          permissions.BROWSE_STORAGE,
          permissions.DELETE_OWN_PRIVATE_CONTENT,
          permissions.PROTECT_OWN_PUBLIC_CONTENT,
          permissions.VIEW_USERS,
          permissions.MANAGE_PUBLIC_CONTENT,
          permissions.MANAGE_USERS,
          permissions.MANAGE_SETUP,
          permissions.BATCH_PROCESS_DATA,
          permissions.DELETE_ANY_PRIVATE_CONTENT
        ]);
      });
    });
  });

});
