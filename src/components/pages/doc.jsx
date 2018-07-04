const React = require('react');
const { Button } = require('antd');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const SectionDisplay = require('../section-display.jsx');
const RendererFactory = require('../../plugins/renderer-factory');

class Doc extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleEditClick() {
    const { initialState } = this.props;
    const { doc } = initialState;
    window.location = `/edit/doc/${doc.key}`;
  }

  render() {
    const { initialState, rendererFactory } = this.props;
    const { sections, language } = initialState;

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
          <Button type="primary" icon="edit" onClick={this.handleEditClick}>Bearbeiten</Button>
        </PageHeader>
        <PageContent>
          {children}
        </PageContent>
      </Page>
    );
  }
}

Doc.propTypes = {
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
    })),
    language: PropTypes.string.isRequired
  }).isRequired,
  rendererFactory: PropTypes.instanceOf(RendererFactory).isRequired
};

module.exports = inject({
  rendererFactory: RendererFactory
}, Doc);
