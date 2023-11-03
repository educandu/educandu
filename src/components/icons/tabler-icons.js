import React from 'react';
import iconNs from '@ant-design/icons';
import {
  IconArrowBackUp,
  IconArrowRight,
  IconBallpen,
  IconBrandSpeedtest,
  IconBrush,
  IconBucketDroplet,
  IconChalkboard,
  IconCircle,
  IconCircleSquare,
  IconClick,
  IconDownload,
  IconEraser,
  IconFileUpload,
  IconForms,
  IconListCheck,
  IconRepeat,
  IconRepeatOff,
  IconRuler3,
  IconSquare,
  IconSquareFilled,
  IconTextCaption,
  IconTextResize,
  IconTriangle,
  IconTypography
} from '@tabler/icons-react';

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

export const BrushIcon = createTablerIcon(IconBrush);
export const ClickIcon = createTablerIcon(IconClick);
export const FormsIcon = createTablerIcon(IconForms);
export const CircleIcon = createTablerIcon(IconCircle);
export const EraserIcon = createTablerIcon(IconEraser);
export const RepeatIcon = createTablerIcon(IconRepeat);
export const Ruler3Icon = createTablerIcon(IconRuler3);
export const SquareIcon = createTablerIcon(IconSquare);
export const BallpenIcon = createTablerIcon(IconBallpen);
export const DownloadIcon = createTablerIcon(IconDownload);
export const TriangleIcon = createTablerIcon(IconTriangle);
export const ListCheckIcon = createTablerIcon(IconListCheck);
export const RepeatOffIcon = createTablerIcon(IconRepeatOff);
export const ArrowRightIcon = createTablerIcon(IconArrowRight);
export const ChalkboardIcon = createTablerIcon(IconChalkboard);
export const FileUploadIcon = createTablerIcon(IconFileUpload);
export const TextResizeIcon = createTablerIcon(IconTextResize);
export const TypographyIcon = createTablerIcon(IconTypography);
export const ArrowBackUpIcon = createTablerIcon(IconArrowBackUp);
export const TextCaptionIcon = createTablerIcon(IconTextCaption);
export const CircleSquareIcon = createTablerIcon(IconCircleSquare);
export const SquareFilledIcon = createTablerIcon(IconSquareFilled);
export const BucketDropletIcon = createTablerIcon(IconBucketDroplet);
export const BrandSpeedtestIcon = createTablerIcon(IconBrandSpeedtest);

// Aliases:
// eslint-disable-next-line no-warning-comments
// TODO Export under domain specific names
