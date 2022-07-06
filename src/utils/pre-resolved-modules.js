import { isBrowser } from '../ui/browser-helper.js';

export let FormItemInputContext = null;

export async function ensurePreResolvedModulesAreLoaded() {
  if (isBrowser()) {
    FormItemInputContext = (await import('antd/es/form/context.js')).FormItemInputContext;
  } else {
    FormItemInputContext = (await import('antd/lib/form/context.js')).FormItemInputContext;
  }
}
