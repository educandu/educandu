import { Divider } from 'antd';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

function MediaLibraryOptions({ option1, option2 }) {
  const { t } = useTranslation('mediaLibraryOptions');

  return (
    <div className="MediaLibraryOptions">
      <div className="MediaLibraryOptions-column">
        {option1}
      </div>
      {!!option2 && (
        <Fragment>
          <div className="MediaLibraryOptions-divider MediaLibraryOptions-divider--vertical" >
            <div className="MediaLibraryOptions-dividerVerticalSegment" />
            {t('common:or')}
            <div className="MediaLibraryOptions-dividerVerticalSegment" />
          </div>
          <div className="MediaLibraryOptions-divider MediaLibraryOptions-divider--horizontal" >
            <Divider plain>
              {t('common:or')}
            </Divider>
          </div>
        </Fragment>
      )}
      {!!option2 && (
        <div className="MediaLibraryOptions-column">
          {option2}
        </div>
      )}
    </div>
  );
}

MediaLibraryOptions.propTypes = {
  option1: PropTypes.node.isRequired,
  option2: PropTypes.node
};

MediaLibraryOptions.defaultProps = {
  option2: null
};

export default MediaLibraryOptions;
