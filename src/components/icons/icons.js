import React from 'react';
import iconNs from '@ant-design/icons';
import LineIconComponent from './svgs/line-icon-component.js';
import {
  IconArrowBackUp,
  IconArrowRight,
  IconBallpen,
  IconBrandSpeedtest,
  IconBrush,
  IconBucketDroplet,
  IconCircle,
  IconCircleSquare,
  IconClick,
  IconDownload,
  IconEraser,
  IconLoader2,
  IconRepeat,
  IconRepeatOff,
  IconRuler3,
  IconSquare,
  IconSquareFilled,
  IconTextCaption,
  IconTextResize,
  IconTriangle,
  IconTypography,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconZoomScan,
  IconHeart,
  IconStarFilled,
  IconSettings,
  IconCategory2,
  IconTag,
  IconBuildingBank,
  IconTableImport,
  IconTableDown
} from '@tabler/icons-react';

const Icon = iconNs.default || iconNs;

function createIconFromSvgComponent(SvgComponent) {
  function AntdIconWrapper(props) {
    return <Icon component={SvgComponent} {...props} />;
  }
  return AntdIconWrapper;
}

function createIconFromTablerIconComponent(TablerIconComponent, { filled } = {}) {
  function TablerIconWrapper() {
    return <TablerIconComponent size="1em" stroke={1.5} fill={filled ? 'currentColor': 'none'} />;
  }
  return createIconFromSvgComponent(TablerIconWrapper);
}

export const TagIcon = createIconFromTablerIconComponent(IconTag);
export const LineIcon = createIconFromSvgComponent(LineIconComponent);
export const ClickIcon = createIconFromTablerIconComponent(IconClick);
export const SpinIcon = createIconFromTablerIconComponent(IconLoader2);
export const SelectIcon = createIconFromTablerIconComponent(IconClick);
export const CircleIcon = createIconFromTablerIconComponent(IconCircle);
export const EraserIcon = createIconFromTablerIconComponent(IconEraser);
export const RepeatIcon = createIconFromTablerIconComponent(IconRepeat);
export const SquareIcon = createIconFromTablerIconComponent(IconSquare);
export const FavoriteIcon = createIconFromTablerIconComponent(IconHeart);
export const StarIcon = createIconFromTablerIconComponent(IconStarFilled);
export const TextIcon = createIconFromTablerIconComponent(IconTypography);
export const ArrowIcon = createIconFromTablerIconComponent(IconArrowRight);
export const FreeDrawIcon = createIconFromTablerIconComponent(IconBallpen);
export const RectangleIcon = createIconFromTablerIconComponent(IconSquare);
export const DownloadIcon = createIconFromTablerIconComponent(IconDownload);
export const ResetIcon = createIconFromTablerIconComponent(IconArrowBackUp);
export const StopIcon = createIconFromTablerIconComponent(IconSquareFilled);
export const StrokeColorIcon = createIconFromTablerIconComponent(IconBrush);
export const TriangleIcon = createIconFromTablerIconComponent(IconTriangle);
export const SettingsIcon = createIconFromTablerIconComponent(IconSettings);
export const InputsIcon = createIconFromTablerIconComponent(IconTextCaption);
export const ShapeIcon = createIconFromTablerIconComponent(IconCircleSquare);
export const CategoryIcon = createIconFromTablerIconComponent(IconCategory2);
export const StrokeWidthIcon = createIconFromTablerIconComponent(IconRuler3);
export const FontSizeIcon = createIconFromTablerIconComponent(IconTextResize);
export const RepeatOffIcon = createIconFromTablerIconComponent(IconRepeatOff);
export const TableExportIcon = createIconFromTablerIconComponent(IconTableDown);
export const ExitFullscreenIcon = createIconFromTablerIconComponent(IconMinimize);
export const FillColorIcon = createIconFromTablerIconComponent(IconBucketDroplet);
export const ChevronLeftIcon = createIconFromTablerIconComponent(IconChevronLeft);
export const TableImportIcon = createIconFromTablerIconComponent(IconTableImport);
export const EnterFullscreenIcon = createIconFromTablerIconComponent(IconMaximize);
export const ChevronRightIcon = createIconFromTablerIconComponent(IconChevronRight);
export const MediaLibraryIcon = createIconFromTablerIconComponent(IconBuildingBank);
export const ContentManagementIcon = createIconFromTablerIconComponent(IconZoomScan);
export const PlaybackRateIcon = createIconFromTablerIconComponent(IconBrandSpeedtest);
export const ChevronLeftPipeIcon = createIconFromTablerIconComponent(IconChevronLeftPipe);
export const FavoriteIconFilled = createIconFromTablerIconComponent(IconHeart, { filled: true });
