import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { RESOURCE_USAGE } from '../domain/constants.js';
import { NoLongerUsedIcon, NotUsedIcon, UsedIcon } from './icons/icons.js';

function ResourceUsageCell({ resourceUsage }) {
  const { t } = useTranslation();

  let Icon;
  let tooltip;
  let className;

  switch (resourceUsage) {
    case RESOURCE_USAGE.used:
      Icon = UsedIcon;
      tooltip = t('common:used');
      className = 'ResourceUsageCell ResourceUsageCell--used';
      break;
    case RESOURCE_USAGE.deprecated:
      Icon = NoLongerUsedIcon;
      tooltip = t('common:noLongerUsed');
      className = 'ResourceUsageCell ResourceUsageCell--deprecated';
      break;
    case RESOURCE_USAGE.unused:
      Icon = NotUsedIcon;
      tooltip = t('common:neverUsed');
      className = 'ResourceUsageCell ResourceUsageCell--unused';
      break;
    default:
      throw new Error(`Invalid resource usage value '${resourceUsage}'`);
  }

  return (
    <div className={className}>
      <Tooltip title={tooltip}>
        <Icon />
      </Tooltip>
    </div>
  );
}

ResourceUsageCell.propTypes = {
  resourceUsage: PropTypes.oneOf(Object.values(RESOURCE_USAGE)).isRequired
};

export default ResourceUsageCell;
