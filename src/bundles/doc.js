const MarkdownPlugin = require('../plugins/markdown/client-renderer');
const QuickTesterPlugin = require('../plugins/quick-tester/client-renderer');

function getPluginForType(type) {
  switch (type) {
    case 'markdown':
      return new MarkdownPlugin();
    case 'quick-tester':
      return new QuickTesterPlugin();
    default:
      throw new Error(`Plugin for type ${type} is not available.`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const initialState = window.__initalState__;
  initialState.sections.forEach(section => {
    const plugin = getPluginForType(section.type);
    if (plugin) {
      const parentElement = document.body.querySelector(`[data-section-id="${section._id}"]`);
      plugin.init(parentElement);
    }
  });
});
