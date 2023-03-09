import { ROLE } from './constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import permissions, { hasUserPermission, getUserPermissions } from './permissions.js';

describe('permissions', () => {

  describe('hasUserPermission', () => {
    let result;
    let expected;

    describe('when user has role "admin"', () => {
      const adminUser = { role: [ROLE.admin] };

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

  describe('getUserPermissions', () => {
    let result;

    describe('when user has no direct permissions or role', () => {
      beforeEach(() => {
        const user = { permissions: [], role: '' };
        result = getUserPermissions(user);
      });
      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when user has role \'user\'', () => {
      beforeEach(() => {
        const user = { role: ROLE.user };
        result = getUserPermissions(user);
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
        const user = { role: ROLE.accreditedAuthor };
        result = getUserPermissions(user);
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
        const user = { role: ROLE.maintainer };
        result = getUserPermissions(user);
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
        const user = { role: ROLE.admin };
        result = getUserPermissions(user);
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
