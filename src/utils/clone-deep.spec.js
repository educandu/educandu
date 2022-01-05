import cloneDeep from './clone-deep.js';

describe('clone-deep', () => {

  const original = {
    stringProp: 'a',
    numberProp: 1,
    nullProp: null,
    // eslint-disable-next-line no-undefined
    undefinedProp: undefined,
    booleanProp: true,
    dateAsStringProp: new Date().toISOString(),
    dateProp: new Date(),
    functionProp: () => 'function response',
    simpleArrayProp: [1, 2, 3],
    deepArrayProp: [[1], [[2]], { prop: 3 }],
    simpleObjectProp: {
      stringProp: 'b',
      numberProp: 2
    },
    deepObjectProp: {
      objectProp: {
        stringProp: 'c',
        arrayProp: [4],
        nullProp: null
      }
    }
  };

  let clone;

  beforeAll(() => {
    clone = cloneDeep(original);
  });

  it('should clone of the provided value', () => {
    expect(clone).not.toBe(original);
  });

  it('should clone all properties', () => {
    expect(clone).toEqual(original);
  });

  it('should copy functions', () => {
    expect(clone.functionProp).toBe(original.functionProp);
    expect(clone.functionProp()).toBe('function response');
  });

  it('should clone arrays, and not copy them as reference', () => {
    expect(clone.simpleArrayProp).toEqual(original.simpleArrayProp);
    expect(clone.simpleArrayProp).not.toBe(original.simpleArrayProp);
  });

  it('should clone deep array contents, and not copy them as reference', () => {
    expect(clone.deepArrayProp).toEqual(original.deepArrayProp);
    expect(clone.deepArrayProp).not.toBe(original.deepArrayProp);
    expect(clone.deepArrayProp[0]).toEqual(original.deepArrayProp[0]);
    expect(clone.deepArrayProp[0]).not.toBe(original.deepArrayProp[0]);
    expect(clone.deepArrayProp[1]).toEqual(original.deepArrayProp[1]);
    expect(clone.deepArrayProp[1]).not.toBe(original.deepArrayProp[1]);
    expect(clone.deepArrayProp[2]).toEqual(original.deepArrayProp[2]);
    expect(clone.deepArrayProp[2]).not.toBe(original.deepArrayProp[2]);
  });

  it('should clone objects, and not copy them as reference', () => {
    expect(clone.simpleObjectProp).toEqual(original.simpleObjectProp);
    expect(clone.simpleObjectProp).not.toBe(original.simpleObjectProp);
  });

  it('should clone deep object contents, and not copy them as reference', () => {
    expect(clone.deepObjectProp.objectProp).toEqual(original.deepObjectProp.objectProp);
    expect(clone.deepObjectProp.objectProp).not.toBe(original.deepObjectProp.objectProp);
  });
});
