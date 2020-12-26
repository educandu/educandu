import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeletedSection from './deleted-section';
import { SettingOutlined } from '@ant-design/icons';
import SectionActionDropdown from './section-action-dropdown';
import { docShape, sectionShape } from '../ui/default-prop-types';

function SectionDisplay({ DisplayComponent, language, doc, section, onAction }) {
  const [isMouseOver, setIsMouseOver] = React.useState(false);
  const [isDropDownVisible, setIsDropDownVisible] = React.useState(false);

  const sectionClasses = classNames({
    'Section': true,
    'is-active': onAction && (isMouseOver || isDropDownVisible)
  });

  let actionsMenu = null;

  if (onAction) {
    const actionsClasses = classNames({
      'Section-actions': true,
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

  let displayComponent;
  if (section.content) {
    displayComponent = (
      <DisplayComponent
        docKey={doc.key}
        sectionKey={section.key}
        content={section.content[language]}
        language={language}
        />
    );
  } else {
    displayComponent = (
      <DeletedSection section={section} />
    );
  }

  return (
    <section
      key={section.key}
      className={sectionClasses}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
      >
      {displayComponent}
      {actionsMenu}
    </section>
  );
}

SectionDisplay.propTypes = {
  DisplayComponent: PropTypes.func.isRequired,
  doc: docShape.isRequired,
  language: PropTypes.string.isRequired,
  onAction: PropTypes.func,
  section: sectionShape.isRequired
};

SectionDisplay.defaultProps = {
  onAction: null
};

export default SectionDisplay;
