import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function TagsExpander({ tags, initialTagCount, small }) {
  const { t } = useTranslation('tagsExpander');
  const [isExpanded, setIsExpanded] = useState(false);

  const showExpander = tags.length > initialTagCount + 1;
  const tagClassName = small ? 'Tag Tag--small' : 'Tag';
  const componentClassName = small ? 'TagsExpander TagsExpander--small' : 'TagsExpander';
  const expandLinkClassName = small ? 'TagsExpander-expandLink TagsExpander-expandLink--small' : 'TagsExpander-expandLink';

  return (
    <div className={componentClassName}>
      {
        tags
          .filter((_tag, index) => isExpanded || !showExpander || index < initialTagCount)
          .map(tag => <Tag className={tagClassName} key={tag}>{tag}</Tag>)
      }

      {!!showExpander && !!isExpanded && (
        <a className={expandLinkClassName} onClick={() => setIsExpanded(false)}>
          {t('collapse')}
        </a>
      )}
      {!!showExpander && !isExpanded && (
        <a className={expandLinkClassName} onClick={() => setIsExpanded(true)}>
          {t('expand', { count: tags.length - initialTagCount })}
        </a>
      )}
    </div>
  );
}

TagsExpander.propTypes = {
  initialTagCount: PropTypes.number,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  small: PropTypes.bool
};

TagsExpander.defaultProps = {
  initialTagCount: 10,
  small: false
};

export default TagsExpander;
