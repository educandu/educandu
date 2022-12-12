import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ItemsExpander({ className, expandLinkClassName, items, renderItem, initialItemCount }) {
  const { t } = useTranslation('itemsExpander');
  const [isExpanded, setIsExpanded] = useState(false);

  const showExpander = items.length > initialItemCount + 1;

  return (
    <div className={className}>
      {items.filter((_tag, index) => isExpanded || !showExpander || index < initialItemCount).map(renderItem)}
      {!!showExpander && !!isExpanded && (
        <a className={expandLinkClassName} onClick={() => setIsExpanded(false)}>{t('collapse')}</a>
      )}
      {!!showExpander && !isExpanded && (
        <a className={expandLinkClassName} onClick={() => setIsExpanded(true)}>{t('expand', { count: items.length - initialItemCount })}</a>
      )}
    </div>
  );
}

ItemsExpander.propTypes = {
  className: PropTypes.string,
  expandLinkClassName: PropTypes.string,
  initialItemCount: PropTypes.number,
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  renderItem: PropTypes.func.isRequired
};

ItemsExpander.defaultProps = {
  className: '',
  expandLinkClassName: '',
  initialItemCount: 10
};

export default ItemsExpander;
