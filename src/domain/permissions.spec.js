import { ROLE } from './constants.js';
import { exportUser } from './built-in-users.js';
import permissions, { hasUserPermission, getAllUserPermissions } from './permissions.js';

const isTechnicalPermission = permission => permission === permissions.MANAGE_EXPORT_WITH_BUILT_IN_USER;

describe('permissions', () => {

  describe('hasUserPermission', () => {
    let result;
    let expected;

    describe('when user has role "admin"', () => {
      const adminUser = { roles: [ROLE.admin] };

      Object.values(permissions).forEach(permission => {
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
        const user = { permissions: ['custom'], roles: [ROLE.user] };
        result = getAllUserPermissions(user);
      });
      it('should return all user permissions', () => {
        expect(result).toEqual([
          'custom',
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

    describe('when user has role \'maintainer\'', () => {
      beforeEach(() => {
        const user = { permissions: ['custom'], roles: [ROLE.maintainer] };
        result = getAllUserPermissions(user);
      });

      it('should return all maintainer permissions', () => {
        expect(result).toEqual([
          'custom',
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
          permissions.HARD_DELETE_SECTION,
          permissions.DELETE_ANY_STORAGE_FILE,
          permissions.SEE_USER_EMAIL,
          permissions.RESTORE_DOC_REVISIONS,
          permissions.MANAGE_ARCHIVED_DOCS,
          permissions.REVIEW_DOC,
          permissions.VERIFY_DOC,
          permissions.RESTRICT_OPEN_CONTRIBUTION,
          permissions.MANAGE_DOCUMENT_COMMENTS
        ]);
      });
    });

    describe('when user has role \'admin\'', () => {
      beforeEach(() => {
        const user = { permissions: ['custom'], roles: [ROLE.admin] };
        result = getAllUserPermissions(user);
      });

      it('should return all user permissions', () => {
        expect(result).toEqual([
          'custom',
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
          permissions.HARD_DELETE_SECTION,
          permissions.DELETE_ANY_STORAGE_FILE,
          permissions.SEE_USER_EMAIL,
          permissions.RESTORE_DOC_REVISIONS,
          permissions.MANAGE_ARCHIVED_DOCS,
          permissions.REVIEW_DOC,
          permissions.VERIFY_DOC,
          permissions.RESTRICT_OPEN_CONTRIBUTION,
          permissions.MANAGE_DOCUMENT_COMMENTS,
          permissions.ADMIN,
          permissions.EDIT_USERS,
          permissions.VIEW_BATCHES,
          permissions.MIGRATE_DATA,
          permissions.MANAGE_IMPORT,
          permissions.MANAGE_SETTINGS,
          permissions.MANAGE_STORAGE_PLANS,
          permissions.DELETE_FOREIGN_ROOMS
        ]);
      });
    });
  });

});
