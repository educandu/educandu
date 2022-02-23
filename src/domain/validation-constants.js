export const slugValidationPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const tagValidationPattern = /^\S{3,30}$/;

// Min. one letter and min. 1 digit
export const passwordValidationPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const minPasswordLength = 8;

export const maxDocumentDescriptionLength = 1000;
