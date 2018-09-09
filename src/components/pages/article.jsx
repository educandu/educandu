const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { withUser } = require('../user-context.jsx');
const { inject } = require('../container-context.jsx');
const SectionDisplay = require('../section-display.jsx');
const { userProps } = require('../../ui/default-prop-types');
const RendererFactory = require('../../plugins/renderer-factory');

class Article extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleEditClick() {
    const { initialState } = this.props;
    const { doc } = initialState;
    window.location = urls.getEditDocUrl(doc.key);
  }

  render() {
    const { initialState, rendererFactory, user, language } = this.props;
    const { sections } = initialState;

    const children = sections.map(section => {
      const renderer = rendererFactory.createRenderer(section.type);
      const DisplayComponent = renderer.getDisplayComponent();
      return (
        <SectionDisplay
          key={section.key}
          section={section}
          language={language}
          DisplayComponent={DisplayComponent}
          />
      );
    });

    return (
      <Page>
        <PageHeader>
          {user && <Button type="primary" icon="edit" onClick={this.handleEditClick}>Bearbeiten</Button>}
        </PageHeader>
        <PageContent>
          {children}
        </PageContent>
      </Page>
    );
  }
}

Article.propTypes = {
  ...userProps,
  initialState: PropTypes.shape({
    doc: PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    }),
    sections: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      order: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      content: PropTypes.any.isRequired
    }))
  }).isRequired,
  language: PropTypes.string.isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = withUser(inject({
  rendererFactory: RendererFactory
}, Article));
