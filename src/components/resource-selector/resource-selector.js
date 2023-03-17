import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useRoomId } from '../room-context.js';
import { useTranslation } from 'react-i18next';
import { BankOutlined } from '@ant-design/icons';
import { useStorage } from '../storage-context.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { SOURCE_TYPE } from '../../domain/constants.js';
import PrivateIcon from '../icons/general/private-icon.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getSourceType } from '../../utils/source-utils.js';
import WikimediaScreens from './wikimedia/wikimedia-screens.js';
import WikimediaIcon from '../icons/wikimedia/wikimedia-icon.js';
import RoomMediaScreens from './room-media/room-media-screens.js';
import MediaLibraryScreens from './media-library/media-library-screens.js';

const possibleSourceTypes = [
  SOURCE_TYPE.mediaLibrary,
  SOURCE_TYPE.wikimedia,
  SOURCE_TYPE.roomMedia
];

function ResourceSelector({ allowedSourceTypes, initialUrl, onCancel, onSelect }) {
  const roomId = useRoomId();
  const storage = useStorage();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('resourceSelector');
  const [visibleSourceTypes, setVisibleSourceTypes] = useState([]);
  const [selectedSourceType, setSelectedSourceType] = useState(null);

  useEffect(() => {
    const newVisibleSourceTypes = allowedSourceTypes.filter(sourceType => {
      return sourceType === SOURCE_TYPE.roomMedia && (!roomId || !storage)
        ? false
        : possibleSourceTypes.includes(sourceType);

    });

    setVisibleSourceTypes(newVisibleSourceTypes);

    setSelectedSourceType(oldSelectedSourceType => {
      const sourceTypeMatchedByInitialUrl = getSourceType({ url: initialUrl, cdnRootUrl: clientConfig.cdnRootUrl });
      const preferredInitialSourceType = SOURCE_TYPE.roomMedia;
      const firstVisibleSourceType = newVisibleSourceTypes[0];

      const newSourceTypePriorityList = [
        oldSelectedSourceType,
        sourceTypeMatchedByInitialUrl,
        preferredInitialSourceType,
        firstVisibleSourceType
      ];

      return newSourceTypePriorityList.filter(sourceType => newVisibleSourceTypes.includes(sourceType))[0] || null;
    });
  }, [roomId, storage, initialUrl, allowedSourceTypes, clientConfig]);

  const handleSourceTypeTabChange = newSourceType => {
    setSelectedSourceType(newSourceType);
  };

  const renderTabLabel = sourceType => {
    const label = t(`sourceType_${sourceType}`);

    switch (sourceType) {
      case SOURCE_TYPE.mediaLibrary:
        return <div><BankOutlined />{label}</div>;
      case SOURCE_TYPE.roomMedia:
        return <div><PrivateIcon />{label}</div>;
      case SOURCE_TYPE.wikimedia:
        return <div><WikimediaIcon />{label}</div>;
      default:
        return label;
    }
  };

  const renderTabContent = sourceType => {
    const props = { initialUrl, onSelect, onCancel };

    switch (sourceType) {
      case SOURCE_TYPE.mediaLibrary:
        return <MediaLibraryScreens {...props} />;
      case SOURCE_TYPE.roomMedia:
        return <RoomMediaScreens {...props} />;
      case SOURCE_TYPE.wikimedia:
        return <WikimediaScreens {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="ResourceSelector">
      <Tabs
        size="small"
        activeKey={selectedSourceType || visibleSourceTypes[0] || null}
        onChange={handleSourceTypeTabChange}
        destroyInactiveTabPane
        items={visibleSourceTypes.map(sourceType => ({
          key: sourceType,
          label: renderTabLabel(sourceType),
          children: renderTabContent(sourceType)
        }))}
        />
    </div>
  );
}

ResourceSelector.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SOURCE_TYPE))),
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

ResourceSelector.defaultProps = {
  allowedSourceTypes: [],
  initialUrl: '',
  onCancel: () => {},
  onSelect: () => {}
};

export default ResourceSelector;
