import cloneDeep from '../utils/clone-deep.js';
import { createSectionRevision } from './section-helper.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const createSection = () => ({
  key: 'shared-section-key',
  type: 'markdown',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  content: {
    text: 'section content'
  }
});

const createAncestorSection = () => ({
  key: 'shared-section-key',
  revision: 'ancestor-revision',
  type: 'markdown',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  content: {
    text: 'ancestor section content'
  }
});

describe('section-helper', () => {

  describe('createSectionRevision', () => {
    let section = null;
    let ancestorSection = null;
    let isRestoreOperation = false;
    let result = null;

    afterEach(() => {
      section = null;
      ancestorSection = null;
      isRestoreOperation = false;
      result = null;
    });

    describe('when it is not a restore operation', () => {

      describe('and there is no ancestor section', () => {

        describe('and the new section has no content', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: null
            };
          });
          it('should throw', () => {
            expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
          });
        });

        describe('and the new section has content', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should set a new revision', () => {
            expect(result.revision).toBeDefined();
          });
          it('should set the new content', () => {
            expect(result.content).toEqual(section.content);
          });
        });

      });

      describe('and there is an ancestor section that has no content', () => {
        beforeEach(() => {
          ancestorSection = {
            ...createAncestorSection(),
            deletedOn: new Date(),
            deletedBy: 'some-user',
            deletedBecause: 'it was not good enough',
            content: null
          };
        });

        describe('and the new section has no content', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: null
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should continue the ancestor section revision', () => {
            expect(result.revision).toBe(ancestorSection.revision);
          });
          it('should continue the ancestor deletion information', () => {
            expect(result.deletedOn).toStrictEqual(ancestorSection.deletedOn);
            expect(result.deletedBy).toBe(ancestorSection.deletedBy);
            expect(result.deletedBecause).toBe(ancestorSection.deletedBecause);
          });
        });

        describe('and the new section has content', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
          });
          it('should throw', () => {
            expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
          });
        });

      });

      describe('and there is an ancestor section that has content', () => {
        beforeEach(() => {
          ancestorSection = {
            ...createAncestorSection()
          };
        });

        describe('and the new section has no content', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: null
            };
          });
          it('should throw', () => {
            expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
          });
        });

        describe('and the new section has content that is identical to the ancestor', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: cloneDeep(ancestorSection.content)
            };

            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should continue the ancestor section revision', () => {
            expect(result.revision).toBe(ancestorSection.revision);
          });
          it('should continue the ancestor section content', () => {
            expect(result.content).toStrictEqual(ancestorSection.content);
          });
        });

        describe('and the new section has content that is different from the ancestor', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should not continue the ancestor section revision', () => {
            expect(result.revision).not.toBe(ancestorSection.revision);
          });
          it('should rather set a new section revision', () => {
            expect(result.revision).toBeDefined();
          });
          it('should not continue the ancestor section content', () => {
            expect(result.content).not.toStrictEqual(ancestorSection.content);
          });
          it('should rather set the new section content', () => {
            expect(result.content).toStrictEqual(section.content);
          });
        });

      });

    });

    describe('when it is a restore operation', () => {
      beforeEach(() => {
        isRestoreOperation = true;
      });

      describe('and there is no ancestor section', () => {

        describe('and the new section has no content', () => {

          describe('and the new section has no deletion information', () => {
            beforeEach(() => {
              section = {
                ...createSection(),
                content: null
              };
            });
            it('should throw', () => {
              expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
            });
          });

          describe('and the new section has deletion information', () => {
            beforeEach(() => {
              section = {
                ...createSection(),
                deletedOn: new Date(),
                deletedBy: 'some-user',
                deletedBecause: 'it was not good enough',
                content: null
              };
              result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
            });
            it('should set a new revision', () => {
              expect(result.revision).toBeDefined();
            });
            it('should set the content to `null`', () => {
              expect(result.content).toBeNull();
            });
          });

        });

        describe('and the new section has content', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should set a new revision', () => {
            expect(result.revision).toBeDefined();
          });
          it('should set the new content', () => {
            expect(result.content).toEqual(section.content);
          });
        });

      });

      describe('and there is an ancestor section that has no content', () => {
        beforeEach(() => {
          ancestorSection = {
            ...createAncestorSection(),
            deletedOn: new Date(),
            deletedBy: 'some-user',
            deletedBecause: 'it was not good enough',
            content: null
          };
        });

        describe('and the new section has no content', () => {

          describe('and the new section has no deletion information', () => {
            beforeEach(() => {
              section = {
                ...createSection(),
                content: null
              };
            });
            it('should throw', () => {
              expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
            });
          });

          describe('and the new section has deletion information that is identical to the ancestor', () => {
            beforeEach(() => {
              section = {
                ...createSection(),
                deletedOn: new Date(ancestorSection.deletedOn.getTime()),
                deletedBy: ancestorSection.deletedBy,
                deletedBecause: ancestorSection.deletedBecause,
                content: null
              };
              result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
            });
            it('should continue the ancestor section revision', () => {
              expect(result.revision).toBe(ancestorSection.revision);
            });
            it('should continue the ancestor deletion information', () => {
              expect(result.deletedOn).toStrictEqual(ancestorSection.deletedOn);
              expect(result.deletedBy).toBe(ancestorSection.deletedBy);
              expect(result.deletedBecause).toBe(ancestorSection.deletedBecause);
            });
          });

          describe('and the new section has deletion information that is different from the ancestor', () => {
            beforeEach(() => {
              section = {
                ...createSection(),
                deletedOn: new Date(ancestorSection.deletedOn.getTime() - 1),
                deletedBy: 'some-other-user',
                deletedBecause: 'it also was not good enough',
                content: null
              };
              result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
            });

            it('should not continue the ancestor section revision', () => {
              expect(result.revision).not.toBe(ancestorSection.revision);
            });
            it('should rather set a new section revision', () => {
              expect(result.revision).toBeDefined();
            });
            it('should not continue the ancestor deletion information', () => {
              expect(result.deletedOn).not.toStrictEqual(ancestorSection.deletedOn);
              expect(result.deletedBy).not.toBe(ancestorSection.deletedBy);
              expect(result.deletedBecause).not.toBe(ancestorSection.deletedBecause);
            });
            it('should rather set the restored section deletion information', () => {
              expect(result.deletedOn).toStrictEqual(section.deletedOn);
              expect(result.deletedBy).toBe(section.deletedBy);
              expect(result.deletedBecause).toBe(section.deletedBecause);
            });
          });

        });

        describe('and the new section has content', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should not continue the ancestor section revision', () => {
            expect(result.revision).not.toBe(ancestorSection.revision);
          });
          it('should rather set a new section revision', () => {
            expect(result.revision).toBeDefined();
          });
          it('should set the new section content', () => {
            expect(result.content).toStrictEqual(section.content);
          });
        });

      });

      describe('and there is an ancestor section that has content', () => {
        beforeEach(() => {
          ancestorSection = {
            ...createAncestorSection()
          };
        });

        describe('and the new section has no content', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: null
            };
          });
          it('should throw', () => {
            expect(() => createSectionRevision({ section, ancestorSection, isRestoreOperation })).toThrow();
          });
        });

        describe('and the new section has content that is identical to the ancestor', () => {
          beforeEach(() => {
            section = {
              ...createSection(),
              content: cloneDeep(ancestorSection.content)
            };

            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should continue the ancestor section revision', () => {
            expect(result.revision).toBe(ancestorSection.revision);
          });
          it('should continue the ancestor section content', () => {
            expect(result.content).toStrictEqual(ancestorSection.content);
          });
        });

        describe('and the new section has content that is different from the ancestor', () => {
          beforeEach(() => {
            section = {
              ...createSection()
            };
            result = createSectionRevision({ section, ancestorSection, isRestoreOperation });
          });
          it('should not continue the ancestor section revision', () => {
            expect(result.revision).not.toBe(ancestorSection.revision);
          });
          it('should rather set a new section revision', () => {
            expect(result.revision).toBeDefined();
          });
          it('should not continue the ancestor section content', () => {
            expect(result.content).not.toStrictEqual(ancestorSection.content);
          });
          it('should rather set the new section content', () => {
            expect(result.content).toStrictEqual(section.content);
          });
        });

      });

    });

  });

});
