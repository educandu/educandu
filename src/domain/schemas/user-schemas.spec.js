import { ROLE } from '../constants.js';
import { validate } from '../validation.js';
import { describe, expect, it } from 'vitest';
import uniqueId from '../../utils/unique-id.js';
import { maxUserDisplayNameLength, minUserDisplayNameLength } from '../validation-constants.js';
import {
  postUserRegistrationRequestBodySchema,
  postUserAccountBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRoleBodySchema,
  postUserProfileBodySchema
} from './user-schemas.js';

const displayName = 'John Doe';
const password = 'joedoe78';
const email = 'joedoe78@gmail.com';

const invalidDisplayNameCases = [
  {
    description: 'displayName is shorter than min length',
    body: { displayName: Array.from({ length: minUserDisplayNameLength - 1 }, () => 'x').join('') }
  },
  {
    description: 'displayName is longer than max length',
    body: { displayName: Array.from({ length: maxUserDisplayNameLength + 1 }, () => 'x').join('') }
  }
];
const validDisplayNameCases = [
  {
    description: 'displayName is as long as min length',
    body: { displayName: Array.from({ length: minUserDisplayNameLength }, () => 'x').join('') }
  },
  {
    description: 'displayName is as long as max length',
    body: { displayName: Array.from({ length: maxUserDisplayNameLength }, () => 'x').join('') }
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
const validPasswordCases = [
  {
    description: 'password is longer than min length and contains digits',
    body: { password }
  }
];

const invalidEmailCases = [
  {
    description: 'email is not lowercased',
    body: { email: 'JoeDoe78@gmail.com' }
  }
];
const validEmailCases = [
  {
    description: 'email is lowercased',
    body: { email }
  }
];

describe('postUserRegistrationRequestBodySchema', () => {
  const validBody = { email, password, displayName };

  const validTestCases = [...validDisplayNameCases, ...validPasswordCases, ...validEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  const invalidTestCases = [...invalidDisplayNameCases, ...invalidPasswordCases, ...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when displayName is missing', () => {
    it('should fail validation', () => {
      const body = { password, email };
      expect(() => validate(body, postUserRegistrationRequestBodySchema)).toThrow();
    });
  });

  describe('when password is missing', () => {
    it('should fail validation', () => {
      const body = { email, displayName };
      expect(() => validate(body, postUserRegistrationRequestBodySchema)).toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      const body = { password, displayName };
      expect(() => validate(body, postUserRegistrationRequestBodySchema)).toThrow();
    });
  });

  validTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should pass validation', () => expect(() => validate(body, postUserRegistrationRequestBodySchema)).not.toThrow());
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserRegistrationRequestBodySchema)).toThrow());
    });
  });
});

describe('postUserAccountBodySchema', () => {
  const validBody = { email };
  const invalidTestCases = [...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserAccountBodySchema)).not.toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      const body = { };
      expect(() => validate(body, postUserAccountBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserAccountBodySchema)).toThrow());
    });
  });
});

describe('postUserPasswordResetRequestBodySchema', () => {
  const validBody = { email, password };
  const invalidTestCases = [...invalidEmailCases]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserPasswordResetRequestBodySchema)).not.toThrow();
    });
  });

  describe('when email is missing', () => {
    it('should fail validation', () => {
      expect(() => validate({ password: validBody.password }, postUserPasswordResetRequestBodySchema)).toThrow();
    });
  });

  describe('when password is missing', () => {
    it('should fail validation', () => {
      expect(() => validate({ email: validBody.email }, postUserPasswordResetRequestBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserPasswordResetRequestBodySchema)).toThrow());
    });
  });
});

describe('postUserPasswordResetCompletionBodySchema', () => {
  const validBody = { passwordResetRequestId: uniqueId.create(), verificationCode: uniqueId.create() };
  const invalidTestCases = [
    {
      description: 'passwordResetRequestId is empty',
      body: { passwordResetRequestId: '', verificationCode: validBody.verificationCode }
    },
    {
      description: 'verificationCode is empty',
      body: { passwordResetRequestId: validBody.passwordResetRequestId, verificationCode: '' }
    }
  ]
    .map(({ description, body }) => ({ description, body: { ...validBody, ...body } }));

  describe('when body contains correct data', () => {
    it('should pass validation', () => {
      expect(() => validate(validBody, postUserPasswordResetCompletionBodySchema)).not.toThrow();
    });
  });

  describe('when verificationCode is missing', () => {
    it('should fail validation', () => {
      const body = { passwordResetRequestId: '123' };
      expect(() => validate(body, postUserPasswordResetCompletionBodySchema)).toThrow();
    });
  });

  describe('when passwordResetRequestId is missing', () => {
    it('should fail validation', () => {
      const body = { verificationCode: '456' };
      expect(() => validate(body, postUserPasswordResetCompletionBodySchema)).toThrow();
    });
  });

  invalidTestCases.forEach(({ description, body }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(body, postUserPasswordResetCompletionBodySchema)).toThrow());
    });
  });
});

describe('postUserProfileBodySchema', () => {
  describe('when body contains no data', () => {
    it('should fail validation', () => {
      expect(() => validate({}, postUserProfileBodySchema)).toThrow();
    });
  });

  describe('when body contains with empty data', () => {
    it('should pass validation', () => {
      expect(() => validate({
        displayName: '',
        organization: '',
        profileOverview: '',
        shortDescription: ''
      }, postUserProfileBodySchema)).toThrow();
    });
  });

  describe('when body contains displayName', () => {
    it('should pass validation', () => {
      expect(() => validate({
        displayName: 'Educandu User',
        organization: '',
        profileOverview: '',
        shortDescription: ''
      }, postUserProfileBodySchema)).not.toThrow();
    });
  });
});

describe('postUserRoleBodySchema', () => {
  describe('when body contains a role', () => {
    it('should pass validation', () => {
      expect(() => validate({ role: ROLE.user }, postUserRoleBodySchema)).not.toThrow();
    });
  });

  describe('when body contains no role', () => {
    it('should fail validation', () => {
      expect(() => validate({ role: '' }, postUserRoleBodySchema)).toThrow();
    });
  });

  describe('when body contains unknown role', () => {
    it('should fail validation', () => {
      expect(() => validate({ role: 'unknown' }, postUserRoleBodySchema)).toThrow();
    });
  });
});
