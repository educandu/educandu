export const slugValidationPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const minTagLength = 1;
export const maxTagLength = 30;
export const tagValidationPattern = /^\S{1,30}$/;

export const minDisplayNameLength = 6;
export const maxDisplayNameLength = 30;

// At least 1 letter and at least 1 digit
export const passwordValidationPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const minPasswordLength = 8;

export const maxDocumentDescriptionLength = 1000;

export const maxCommentTopicLength = 200;
export const maxCommentTextLength = 2000;

export const hexCodeValidationPattern = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
