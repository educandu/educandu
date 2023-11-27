import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function TagsExpander({ tags, initialTagCount }) {
  const { t } = useTranslation('tagsExpander');
  const [isExpanded, setIsExpanded] = useState(false);

  const showExpander = tags.length > initialTagCount + 1;

  return (
    <div className="TagsExpander">
      {
        tags
          .filter((_tag, index) => isExpanded || !showExpander || index < initialTagCount)
          .map(tag => <Tag className="Tag" key={tag}>{tag}</Tag>)
      }

      {!!showExpander && !!isExpanded && (
        <a className="TagsExpander-expandLink" onClick={() => setIsExpanded(false)}>
          {t('collapse')}
        </a>
      )}
      {!!showExpander && !isExpanded && (
        <a className="TagsExpander-expandLink" onClick={() => setIsExpanded(true)}>
          {t('expand', { count: tags.length - initialTagCount })}
        </a>
      )}
    </div>
  );
}

TagsExpander.propTypes = {
  initialTagCount: PropTypes.number,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
};

TagsExpander.defaultProps = {
  initialTagCount: 10
};

export default TagsExpander;
