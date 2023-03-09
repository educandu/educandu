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
          permissions.EDIT_DOC,
          permissions.VIEW_DOCS,
          permissions.EDIT_FILE,
          permissions.VIEW_FILES,
          permissions.DELETE_OWN_FILES,
          permissions.CREATE_FILE,
          permissions.OWN_ROOMS,
          permissions.AUTORIZE_ROOMS_RESOURCES,
          permissions.JOIN_ROOMS,
          permissions.CREATE_DOCUMENT_COMMENTS
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
          permissions.EDIT_DOC,
          permissions.VIEW_DOCS,
          permissions.EDIT_FILE,
          permissions.VIEW_FILES,
          permissions.DELETE_OWN_FILES,
          permissions.CREATE_FILE,
          permissions.OWN_ROOMS,
          permissions.AUTORIZE_ROOMS_RESOURCES,
          permissions.JOIN_ROOMS,
          permissions.CREATE_DOCUMENT_COMMENTS,
          permissions.PROTECT_OWN_DOC
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
          permissions.EDIT_DOC,
          permissions.VIEW_DOCS,
          permissions.EDIT_FILE,
          permissions.VIEW_FILES,
          permissions.DELETE_OWN_FILES,
          permissions.CREATE_FILE,
          permissions.OWN_ROOMS,
          permissions.AUTORIZE_ROOMS_RESOURCES,
          permissions.JOIN_ROOMS,
          permissions.CREATE_DOCUMENT_COMMENTS,
          permissions.PROTECT_OWN_DOC,
          permissions.HARD_DELETE_SECTION,
          permissions.DELETE_ANY_STORAGE_FILE,
          permissions.SEARCH_USERS,
          permissions.SEE_USER_EMAIL,
          permissions.RESTORE_DOC_REVISIONS,
          permissions.ARCHIVE_DOC,
          permissions.REVIEW_DOC,
          permissions.VERIFY_DOC,
          permissions.PROTECT_ANY_DOC,
          permissions.MANAGE_DOCUMENT_COMMENTS,
          permissions.MANAGE_CONTENT,
          permissions.MANAGE_ACCREDITED_EDITORS
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
          permissions.EDIT_DOC,
          permissions.VIEW_DOCS,
          permissions.EDIT_FILE,
          permissions.VIEW_FILES,
          permissions.DELETE_OWN_FILES,
          permissions.CREATE_FILE,
          permissions.OWN_ROOMS,
          permissions.AUTORIZE_ROOMS_RESOURCES,
          permissions.JOIN_ROOMS,
          permissions.CREATE_DOCUMENT_COMMENTS,
          permissions.PROTECT_OWN_DOC,
          permissions.HARD_DELETE_SECTION,
          permissions.DELETE_ANY_STORAGE_FILE,
          permissions.SEARCH_USERS,
          permissions.SEE_USER_EMAIL,
          permissions.RESTORE_DOC_REVISIONS,
          permissions.ARCHIVE_DOC,
          permissions.REVIEW_DOC,
          permissions.VERIFY_DOC,
          permissions.PROTECT_ANY_DOC,
          permissions.MANAGE_DOCUMENT_COMMENTS,
          permissions.MANAGE_CONTENT,
          permissions.MANAGE_ACCREDITED_EDITORS,
          permissions.ADMIN,
          permissions.MANAGE_USERS,
          permissions.MANAGE_BATCHES,
          permissions.MIGRATE_DATA,
          permissions.MANAGE_SETTINGS,
          permissions.MANAGE_STORAGE_PLANS,
          permissions.DELETE_FOREIGN_ROOMS
        ]);
      });
    });
  });

});
