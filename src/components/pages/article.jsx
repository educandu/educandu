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
const RendererFactory = require('../../plugins/renderer-factory');
const { userProps, docShape, sectionShape } = require('../../ui/default-prop-types');

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
    const { doc, sections } = initialState;

    const children = sections.map(section => {
      const renderer = rendererFactory.createRenderer(section.type);
      const DisplayComponent = renderer.getDisplayComponent();
      return (
        <SectionDisplay
          key={section.key}
          doc={doc}
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
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = withUser(inject({
  rendererFactory: RendererFactory
}, Article));
