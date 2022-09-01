import MigrationScript from './educandu-2022-09-01-01-transform-image-tiles-plugin-to-catalog-plugin.js';

const IMAGE_TILES_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'image-tiles',
  content: {
    tiles: [
      {
        description: 'Winterreise - Im Dorfe - Seite 1',
        image: {
          sourceType: 'internal',
          sourceUrl: 'media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-1-agnFZQFvaeLxR4ktQUkDa8.jpg'
        },
        link: {
          sourceType: 'external',
          sourceUrl: 'https://cdn.elmu.online/media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-1-agnFZQFvaeLxR4ktQUkDa8.jpg',
          documentId: ''
        }
      },
      {
        description: 'Winterreise - Im Dorfe - Seite 2',
        image: {
          sourceType: 'internal',
          sourceUrl: 'media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-2-wDaTtsFtM41ec8ukpJ9Lge.jpg'
        },
        link: {
          sourceType: 'document',
          sourceUrl: '',
          documentId: 'ugnhuEX3jbriSqUdKUyxno'
        }
      }
    ],
    maxTilesPerRow: 4,
    hoverEffect: 'none',
    width: 100
  }
};

const CATALOG_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'catalog',
  content: {
    displayMode: 'image-tiles',
    title: '',
    width: 100,
    items: [
      {
        title: 'Winterreise - Im Dorfe - Seite 1',
        image: {
          sourceType: 'internal',
          sourceUrl: 'media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-1-agnFZQFvaeLxR4ktQUkDa8.jpg'
        },
        link: {
          sourceType: 'external',
          sourceUrl: 'https://cdn.elmu.online/media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-1-agnFZQFvaeLxR4ktQUkDa8.jpg',
          documentId: ''
        }
      },
      {
        title: 'Winterreise - Im Dorfe - Seite 2',
        image: {
          sourceType: 'internal',
          sourceUrl: 'media/ugnhuEX3jbriSqUdKUyxno/schubert-winterreise-17-im-dorfe-seite-2-wDaTtsFtM41ec8ukpJ9Lge.jpg'
        },
        link: {
          sourceType: 'document',
          sourceUrl: '',
          documentId: 'ugnhuEX3jbriSqUdKUyxno'
        }
      }
    ],
    imageTilesConfig: {
      maxTilesPerRow: 4,
      hoverEffect: 'none'
    }
  }
};

describe('educandu-2022-09-01-01-transform-image-tiles-plugin-to-catalog-plugin', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('sectionUp', () => {
    it('converts the image-tiles data structure to the catalog data structure correctly', () => {
      const input = JSON.parse(JSON.stringify(IMAGE_TILES_SECTION));
      const expectedResult = CATALOG_SECTION;
      const actualResult = sut.sectionUp(input);
      expect(actualResult).toStrictEqual(expectedResult);
    });
  });

  describe('sectionDown', () => {
    it('converts the catalog data structure to the image-tiles data structure correctly', () => {
      const input = JSON.parse(JSON.stringify(CATALOG_SECTION));
      const expectedResult = IMAGE_TILES_SECTION;
      const actualResult = sut.sectionDown(input);
      expect(actualResult).toStrictEqual(expectedResult);
    });
  });

});
