import { ensureIsUnique } from './array-utils.js';

export function ensurePluginComponentAreLoadedForSections({ sections, pluginRegistry, displayOnly }) {
  const neededSectionTypes = ensureIsUnique(sections.map(section => section.type));
  const neededDisplays = [];
  const neededEditors = [];

  for (const type of neededSectionTypes) {
    const plugin = pluginRegistry.getRegisteredPlugin(type);
    if (plugin) {
      if (!plugin.displayComponent) {
        neededDisplays.push(plugin);
      }
      if (!displayOnly && !plugin.editorComponent) {
        neededEditors.push(plugin);
      }
    }
  }

  return Promise.all([
    Promise.resolve(),
    ...neededDisplays.map(plugin => plugin.ensureDisplayComponentIsLoaded()),
    ...neededEditors.map(plugin => plugin.ensureEditorComponentIsLoaded())
  ]);
}
