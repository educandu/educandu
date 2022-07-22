import { ROLE } from '../constants.js';
import { maxDisplayNameLength, minDisplayNameLength } from '../validation-constants.js';
import { validate } from '../validation.js';
import {
  postUserBodySchema,
  postUserAccountBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserProfileBodySchema
} from './user-schemas.js';

const displayName = 'John Doe';
const password = 'joedoe78';
const email = 'joedoe78@gmail.com';

const invalidDisplayNameCases = [
  {
    description: 'displayName is shorter than min length',
    body: { displayName: [...Array(minDisplayNameLength - 1).keys()].join('') }
  },
  {
    description: 'displayName is longer than max length',
    body: { displayName: [...Array(maxDisplayNameLength + 1).keys()].join('') }
  }
];

const invalidPasswordCases = [
  {
    description: 'password is shorter than min length',
    body: { password: 'joedoe7' }
  },
  {
    description: 'password does not contain digits',
    body: { password: 'jonathandoe' }
  },
  {
    description: 'password does not contain letters',
    body: { password: '12345678' }
  }
];

const invalidEmailCases = [
  {
    description: 'email is not lowercased',
    body: { email: 'JoeDoe78@gmail.com' }
  }
];

describe('postUserBodySchema', () => {
  const validBody = { email, password, displayName };
  const invalidTestCases = [...invalidDisplayNameCases, ...invalidPasswordCases, ...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserBodySchema)).not.toThrow();
    });
  });

  describe('when displayName is missing', () => {
    it('should fail validation', () => {
      const body = { password, email };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  describe('when password is missing', () => {
    it('should fail validation', () => {
      const body = { email, displayName };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      const body = { password, displayName };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserBodySchema)).toThrow());
    });
  });
});

describe('postUserAccountBodySchema', () => {
  const validBody = { email, displayName };
  const invalidTestCases = [...invalidDisplayNameCases, ...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserAccountBodySchema)).not.toThrow();
    });
  });

  describe('when displayName is missing', () => {
    it('should fail validation', () => {
      const body = { password };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      const body = { displayName };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserAccountBodySchema)).toThrow());
    });
  });
});

describe('postUserPasswordResetRequestBodySchema', () => {
  const validBody = { email };
  const invalidTestCases = [...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserPasswordResetRequestBodySchema)).not.toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      expect(() => validate({}, postUserBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserPasswordResetRequestBodySchema)).toThrow());
    });
  });
});

describe('postUserPasswordResetCompletionBodySchema', () => {
  const validBody = { password, passwordResetRequestId: '123' };
  const invalidTestCases = [
    ...invalidPasswordCases,
    {
      description: 'passwordResetRequestId is empty',
      body: { password, passwordResetRequestId: '' }
    }
  ]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserPasswordResetCompletionBodySchema)).not.toThrow();
    });
  });

  describe('when password is missing', () => {
    it('should fail validation', () => {
      const body = { passwordResetRequestId: '123' };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  describe('when passwordResetRequestId is missing', () => {
    it('should fail validation', () => {
      const body = { password };
      expect(() => validate(body, postUserBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserPasswordResetCompletionBodySchema)).toThrow());
    });
  });
});

describe('postUserProfileBodySchema', () => {
  describe('when body contains no profile', () => {
    it('should fail validation', () => {
      expect(() => validate({}, postUserProfileBodySchema)).toThrow();
    });
  });

  describe('when body contains empty profile', () => {
    it('should pass validation', () => {
      expect(() => validate({ profile: {} }, postUserProfileBodySchema)).not.toThrow();
    });
  });

  describe('when body contains profile with empty data', () => {
    it('should pass validation', () => {
      expect(() => validate({
        profile: {
          city: '',
          country: '',
          firstName: '',
          lastName: '',
          postalCode: '',
          street: '',
          streetSupplement: ''
        }
      }, postUserProfileBodySchema)).not.toThrow();
    });
  });
});

describe('postUserRolesBodySchema', () => {
  describe('when body contains one role', () => {
    it('should pass validation', () => {
      expect(() => validate({ roles: [ROLE.user] }, postUserRolesBodySchema)).not.toThrow();
    });
  });

  describe('when body contains all roles', () => {
    it('should pass validation', () => {
      expect(() => validate({ roles: Object.values(ROLE) }, postUserRolesBodySchema)).not.toThrow();
    });
  });

  describe('when body contains no roles', () => {
    it('should fail validation', () => {
      expect(() => validate({ roles: [] }, postUserRolesBodySchema)).toThrow();
    });
  });

  describe('when body contains unknown role', () => {
    it('should fail validation', () => {
      expect(() => validate({ roles: ['unknown'] }, postUserRolesBodySchema)).toThrow();
    });
  });
});
