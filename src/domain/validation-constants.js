export const minDocumentTagLength = 1;
export const maxDocumentTagLength = 30;
export const documentTagValidationPattern = /^\S{1,30}$/;
export const maxDocumentDescriptionLength = 1000;
export const maxDocumentCommentTopicLength = 200;
export const maxDocumentCommentTextLength = 2000;

export const minUserDisplayNameLength = 6;
export const maxUserDisplayNameLength = 30;
export const maxUserOrganizationLength = 100;
export const maxUserIntroductionLength = 1500;
export const minUserPasswordLength = 8;

export const maxMediaLibraryItemDescriptionLength = 1000;

export const slugValidationPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const hexCodeValidationPattern = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

// At least 1 letter and at least 1 digit
export const passwordValidationPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;

// Antd uses the `async-validator` package, which in turn uses the following regex from http://emailregex.com/
// eslint-disable-next-line no-useless-escape
export const emailValidationPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/;
