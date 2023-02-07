import { beforeEach, describe, expect, it } from 'vitest';
import { processWikimediaResponse } from './wikimedia-utils.js';

describe('wikimedia-utils', () => {

  describe('processWikimediaResponse', () => {
    let responseData;
    let result;

    describe('when the search can be continued', () => {
      beforeEach(() => {
        responseData = {
          continue: {
            gsroffset: 50,
            continue: 'gsroffset||'
          }
        };
        result = processWikimediaResponse(responseData);
      });
      it('should set `canContinue` to `true`', () => {
        expect(result.canContinue).toBe(true);
      });
      it('should set `nextOffset` to the continuation offset', () => {
        expect(result.nextOffset).toBe(50);
      });
    });

    describe('when the search cannot be continued', () => {
      beforeEach(() => {
        responseData = {};
        result = processWikimediaResponse(responseData);
      });
      it('should set `canContinue` to `false`', () => {
        expect(result.canContinue).toBe(false);
      });
      it('should set `nextOffset` to -1', () => {
        expect(result.nextOffset).toBe(-1);
      });
    });

    describe('when the search does not contain any pages', () => {
      beforeEach(() => {
        responseData = {
          query: {
            pages: {}
          }
        };
        result = processWikimediaResponse(responseData);
      });
      it('should return an empty file list', () => {
        expect(result.files).toHaveLength(0);
      });
    });

    describe('when the search contains pages', () => {
      beforeEach(() => {
        responseData = {
          query: {
            pages: {
              121637360: {
                pageid: 121637360,
                canonicalurl: 'https://commons.wikimedia.org/wiki/File:1962_proposed_atmospheric_test_program.pdf',
                title: 'File:1962 proposed atmospheric test program.pdf',
                touched: '2022-09-22T01:01:52Z'
              },
              1819832: {
                pageid: 1819832,
                canonicalurl: 'https://commons.wikimedia.org/wiki/File:Www_usda_gov_Acceptence_Test_for_Digital.pdf',
                title: 'File:Www usda gov Acceptence Test for Digital.pdf',
                touched: '2022-10-25T14:27:10Z',
                imageinfo: [
                  {
                    size: 183912,
                    thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Www_usda_gov_Acceptence_Test_for_Digital.pdf/page1-139px-Www_usda_gov_Acceptence_Test_for_Digital.pdf.jpg',
                    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Www_usda_gov_Acceptence_Test_for_Digital.pdf',
                    mime: 'application/pdf'
                  }
                ]
              }
            }
          }
        };
        result = processWikimediaResponse(responseData);
      });
      it('should not include files that do not have an `imageinfo`', () => {
        expect(result.files.some(file => file.pageId === 121637360)).toBe(false);
      });
      it('should map the remaining files correctly', () => {
        expect(result.files[0]).toStrictEqual({
          pageId: 1819832,
          pageUrl: 'https://commons.wikimedia.org/wiki/File:Www_usda_gov_Acceptence_Test_for_Digital.pdf',
          displayName: 'Www usda gov Acceptence Test for Digital.pdf',
          url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Www_usda_gov_Acceptence_Test_for_Digital.pdf',
          thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Www_usda_gov_Acceptence_Test_for_Digital.pdf/page1-139px-Www_usda_gov_Acceptence_Test_for_Digital.pdf.jpg',
          updatedOn: '2022-10-25T14:27:10Z',
          size: 183912,
          mimeType: 'application/pdf'
        });
      });
    });

  });

});
