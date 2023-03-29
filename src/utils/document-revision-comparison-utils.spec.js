import { beforeEach, describe, expect, it } from 'vitest';
import { getInterleavedSectionsChanges, SECTION_CHANGE_TYPE } from './document-revision-comparison-utils.js';

describe('document-revision-comparison-utils', () => {

  describe('getInterleavedSectionsChanges', () => {
    const testCases = [
      {
        description: 'when both key sequences are identical',
        oldSectionKeys: ['a', 'b', 'c'],
        newSectionKeys: ['a', 'b', 'c'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when sections were removed at the end',
        oldSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        newSectionKeys: ['a', 'b', 'c'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['d', SECTION_CHANGE_TYPE.removed],
          ['e', SECTION_CHANGE_TYPE.removed]
        ]
      },
      {
        description: 'when sections were added at the end',
        oldSectionKeys: ['a', 'b', 'c'],
        newSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['d', SECTION_CHANGE_TYPE.added],
          ['e', SECTION_CHANGE_TYPE.added]
        ]
      },
      {
        description: 'when sections were removed at the beginning',
        oldSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        newSectionKeys: ['c', 'd', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.removed],
          ['b', SECTION_CHANGE_TYPE.removed],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['d', SECTION_CHANGE_TYPE.unchanged],
          ['e', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when sections were added at the beginning',
        oldSectionKeys: ['c', 'd', 'e'],
        newSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.added],
          ['b', SECTION_CHANGE_TYPE.added],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['d', SECTION_CHANGE_TYPE.unchanged],
          ['e', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when sections were removed in the middle',
        oldSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        newSectionKeys: ['a', 'b', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.removed],
          ['d', SECTION_CHANGE_TYPE.removed],
          ['e', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when sections were added in the middle',
        oldSectionKeys: ['a', 'b', 'e'],
        newSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.added],
          ['d', SECTION_CHANGE_TYPE.added],
          ['e', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when a section was moved to the end',
        oldSectionKeys: ['a', 'b', 'c'],
        newSectionKeys: ['b', 'c', 'a'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.movedDown],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['a', SECTION_CHANGE_TYPE.movedHere]
        ]
      },
      {
        description: 'when a section was moved to the beginning',
        oldSectionKeys: ['a', 'b', 'c'],
        newSectionKeys: ['c', 'a', 'b'],
        expectedResult: [
          ['c', SECTION_CHANGE_TYPE.movedHere],
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.movedUp]
        ]
      },
      {
        description: 'when a section was moved to the middle',
        oldSectionKeys: ['a', 'b', 'c', 'd', 'e'],
        newSectionKeys: ['a', 'c', 'd', 'b', 'e'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.movedDown],
          ['c', SECTION_CHANGE_TYPE.unchanged],
          ['d', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.movedHere],
          ['e', SECTION_CHANGE_TYPE.unchanged]
        ]
      },
      {
        description: 'when two sections were moved, one section removed and three sections added',
        oldSectionKeys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        newSectionKeys: ['a', 'b', 'l', 'f', 'g', 'h', 'i', 'm', 'j', 'c', 'd', 'k', 'n'],
        expectedResult: [
          ['a', SECTION_CHANGE_TYPE.unchanged],
          ['b', SECTION_CHANGE_TYPE.unchanged],
          ['l', SECTION_CHANGE_TYPE.added],
          ['c', SECTION_CHANGE_TYPE.movedDown],
          ['d', SECTION_CHANGE_TYPE.movedDown],
          ['e', SECTION_CHANGE_TYPE.removed],
          ['f', SECTION_CHANGE_TYPE.unchanged],
          ['g', SECTION_CHANGE_TYPE.unchanged],
          ['h', SECTION_CHANGE_TYPE.unchanged],
          ['i', SECTION_CHANGE_TYPE.unchanged],
          ['m', SECTION_CHANGE_TYPE.added],
          ['j', SECTION_CHANGE_TYPE.unchanged],
          ['c', SECTION_CHANGE_TYPE.movedHere],
          ['d', SECTION_CHANGE_TYPE.movedHere],
          ['k', SECTION_CHANGE_TYPE.unchanged],
          ['n', SECTION_CHANGE_TYPE.added]
        ]
      }
    ];
    testCases.forEach(({ description, oldSectionKeys, newSectionKeys, expectedResult }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = getInterleavedSectionsChanges(oldSectionKeys, newSectionKeys);
        });
        it('should return the expected result', () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

});
