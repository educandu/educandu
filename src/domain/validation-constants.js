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

// Antd uses the `async-validator` package, which in turn uses the following regex from http://emailregex.com/
// eslint-disable-next-line max-len, no-useless-escape
export const emailValidationPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/;
