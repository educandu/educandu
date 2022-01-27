import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeletedSection from './deleted-section.js';
import { useService } from './container-context.js';
import InfoFactory from '../plugins/info-factory.js';
import { sectionShape } from '../ui/default-prop-types.js';
import RendererFactory from '../plugins/renderer-factory.js';
import NotSupportedSection from './not-supported-section.js';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, SnippetsOutlined } from '@ant-design/icons';
import { Button } from 'antd';

function SectionDisplayNew({ section, canEdit }) {
  const infoFactory = useService(InfoFactory);
  const rendererFactory = useService(RendererFactory);

  const sectionClasses = classNames({
    'SectionDisplayNew': true,
    'is-editable': canEdit
  });

  const actions = [
    {
      label: 'edit',
      icon: <EditOutlined key="edit" />,
      handleAction: () => { console.log('EDIT'); }
    },
    {
      label: 'duplicate',
      icon: <SnippetsOutlined key="duplicate" />,
      handleAction: () => { console.log('DUPLICATE'); }
    },
    {
      label: 'delete',
      icon: <DeleteOutlined key="delete" />,
      handleAction: () => { console.log('DELETE'); }
    },
    {
      label: 'moveUp',
      icon: <ArrowUpOutlined key="moveUp" />,
      handleAction: () => { console.log('MOVE_UP'); }
    },
    {
      label: 'moveDown',
      icon: <ArrowDownOutlined key="moveDown" />,
      handleAction: () => { console.log('MOVE_DOWN'); }
    }
  ];

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

  const renderAction = action => <Button className="SectionDisplayNew-actionButton" size="small" icon={action.icon} />;

  return (
    <section className={sectionClasses}>
      {canEdit && (
        <div className="SectionDisplayNew-actions">
          {actions.map(renderAction)}
        </div>
      )}
      {displayComponent}
    </section>
  );
}

SectionDisplayNew.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  section: sectionShape.isRequired
};

export default SectionDisplayNew;
