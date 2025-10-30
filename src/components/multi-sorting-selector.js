import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { ResetIcon } from './icons/icons.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import SortingSelector from './sorting-selector.js';
import { replaceItemAt } from '../utils/array-utils.js';
import { SORTING_DIRECTION } from '../domain/constants.js';

function MultiSortingSelector({ sortings, defaultSorting, options, size, onChange }) {
  const { t } = useTranslation('multiSortingSelector');

  const handleSortingChange = (sortingsIndex, newValues) => {
    const newSortingPairs = replaceItemAt(sortings, newValues, sortingsIndex);
    onChange(newSortingPairs);
  };

  const handleAddSorterClick = () => {
    onChange([...sortings, defaultSorting]);
  };

  const handleResetClick = () => {
    onChange([defaultSorting]);
  };

  return (
    <div className="MultiSortingSelector">
      {sortings.map((sorting, sortingsIndex) => (
        <Fragment key={sortingsIndex}>
          {sortingsIndex > 0 && (
            <div className='MultiSortingSelector-sortersSeparator'>
              {t('sortersJoiningText')}
            </div>
          )}
          <SortingSelector
            size={size}
            options={options}
            sorting={sorting}
            onChange={newValue => handleSortingChange(sortingsIndex, newValue)}
            />
        </Fragment>
      ))}
      <div className="MultiSortingSelector-sorterButtons">
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAddSorterClick}
          >
          {t('addSorterButton')}
        </Button>
        <Button
          size="small"
          icon={<ResetIcon />}
          onClick={handleResetClick}
          >
          {t('resetSortersButton')}
        </Button>
      </div>
    </div>
  );
}

MultiSortingSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    appliedLabel: PropTypes.string,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  sortings: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(Object.values(SORTING_DIRECTION)).isRequired
  })).isRequired,
  defaultSorting: PropTypes.shape({
    value: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(Object.values(SORTING_DIRECTION)).isRequired
  }).isRequired
};

MultiSortingSelector.defaultProps = {
  size: 'middle'
};

export default MultiSortingSelector;
