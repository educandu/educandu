import { validateCreateDocumentRevision } from './create-document-revision-request';

const happyPathData = {
  title: 'My Title',
  slug: 'my-slug',
  namespace: 'articles',
  language: 'en',
  sections: [
    {
      key: 'JD9fjjdj00e8jfkjdhjHNFLD436',
      type: 'markdown',
      content: {
        text: 'Hello world!'
      }
    }
  ]
};

const testCases = [
  {
    description: 'Happy path (new doc)',
    data: {
      ...happyPathData
    },
    expectToPass: true
  },
  {
    description: 'Happy path (updated doc)',
    data: {
      ...happyPathData,
      appendTo: {
        key: 'ftg31hf714zmcmhWTUILD89z3',
        ancestorId: '9znDNV9HFNDELEUjnhjji4409uki8'
      }
    },
    expectToPass: true
  },
  {
    description: 'Empty slug',
    data: {
      ...happyPathData,
      slug: ''
    },
    expectToPass: true
  },
  {
    description: 'Invalid namespace',
    data: {
      ...happyPathData,
      namespace: 'something-wrong'
    },
    expectToPass: false
  },
  {
    description: 'Invalid slug',
    data: {
      ...happyPathData,
      slug: 'trailing-slash/'
    },
    expectToPass: false
  },
  {
    description: 'Invalid title',
    data: {
      ...happyPathData,
      title: ''
    },
    expectToPass: false
  },
  {
    description: 'Unknown section key',
    data: {
      ...happyPathData,
      sections: happyPathData.sections.map(s => ({ ...s, ancestorId: 'gh83z4g9hg9ztewioghuisghd' }))
    },
    expectToPass: false
  }
];

describe('create-document-revision-request', () => {

  describe('validateCreateDocumentRevision', () => {

    testCases.forEach(({ description, data, expectToPass }) => {
      describe(description, () => {
        it(expectToPass ? 'should pass' : 'should fail', () => {
          if (expectToPass) {
            expect(() => validateCreateDocumentRevision(data)).not.toThrow();
          } else {
            expect(() => validateCreateDocumentRevision(data)).toThrow();
          }
        });
      });
    });

  });

});
