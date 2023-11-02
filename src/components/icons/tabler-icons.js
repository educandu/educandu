import React from 'react';
import iconNs from '@ant-design/icons';
import { IconBrandSpeedtest, IconDownload, IconRepeat, IconRepeatOff } from '@tabler/icons-react';

const Icon = iconNs.default || iconNs;

function createTablerIcon(TablerComponent) {
  function TablerWrapper() {
    return <TablerComponent size="1em" stroke={1.5} />;
  }
  function TablerIcon() {
    // eslint-disable-next-line react/jsx-no-bind
    return <Icon component={TablerWrapper} />;
  }
  return TablerIcon;
}

export const RepeatIcon = createTablerIcon(IconRepeat);
export const DownloadIcon = createTablerIcon(IconDownload);
export const RepeatOffIcon = createTablerIcon(IconRepeatOff);
export const BrandSpeedtestIcon = createTablerIcon(IconBrandSpeedtest);
