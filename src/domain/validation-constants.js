export const slugValidationPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const tagValidationPattern = /^\S{3,30}$/;

export const minUsernameLength = 6;

// At least 1 letter and at least 1 digit
export const passwordValidationPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const minPasswordLength = 8;

export const maxDocumentDescriptionLength = 1000;
