import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import { SettingOutlined } from '@ant-design/icons';
import InfoFactory from '../plugins/info-factory.js';
import { sectionShape } from '../ui/default-prop-types.js';
import RendererFactory from '../plugins/renderer-factory.js';
import NotSupportedSection from './not-supported-section.js';
import SectionActionDropdown from './section-action-dropdown.js';

function SectionDisplay({ section, onAction }) {
  const infoFactory = useService(InfoFactory);
  const [isMouseOver, setIsMouseOver] = React.useState(false);
  const [isDropDownVisible, setIsDropDownVisible] = React.useState(false);
  const rendererFactory = useService(RendererFactory);

  const sectionClasses = classNames({
    'SectionDisplay': true,
    'is-active': onAction && (isMouseOver || isDropDownVisible)
  });

  let actionsMenu = null;

  if (onAction) {
    const actionsClasses = classNames({
      'SectionDisplay-actions': true,
      'is-active': isMouseOver || isDropDownVisible
    });

    actionsMenu = (
      <aside className={actionsClasses}>
        <SectionActionDropdown
          section={section}
          placement="bottomRight"
          onAction={action => onAction(action)}
          onVisibleChange={visible => setIsDropDownVisible(visible)}
          >
          <Button icon={<SettingOutlined />} size="small" />
        </SectionActionDropdown>
      </aside>
    );
  }

  const getDisplayComponent = () => {
    const DisplayComponent = rendererFactory.createRenderer(section.type).getDisplayComponent();
    return <DisplayComponent content={section.content} />;
  };

  let displayComponent;
  if (section.content) {
    const isSupportedPlugin = infoFactory.getRegisteredTypes().includes(section.type);
    displayComponent = isSupportedPlugin ? getDisplayComponent() : (<NotSupportedSection />);
  } else {
    displayComponent = (<DeletedSection section={section} />);
  }

  return (
    <section
      key={section.key}
      className={sectionClasses}
      data-section-key={section.key}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
      >
      {displayComponent}
      {actionsMenu}
    </section>
  );
}

SectionDisplay.propTypes = {
  onAction: PropTypes.func,
  section: sectionShape.isRequired
};

SectionDisplay.defaultProps = {
  onAction: null
};

export default SectionDisplay;
