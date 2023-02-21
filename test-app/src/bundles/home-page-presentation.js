import React from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from '../../../src/components/markdown.js';
import MediaPlayer from '../../../src/components/media-player/media-player.js';
import DefaultHeaderLogo from '../../../src/components/default-header-logo.js';

function HomePagePresentation() {
  const { t } = useTranslation('testApp');

  return (
    <div className="HomePagePresentation">
      <div className="HomePagePresentation-videoWrapper">
        <div className="HomePagePresentation-video">
          <MediaPlayer
            renderControls={() => null}
            renderProgressBar={() => null}
            sourceUrl="https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/oma-explainer-vs1-0-pDjYtJexVC91WfrtWnu6hh.mp4"
            posterImageUrl="https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/explainer-poster-4c1tzNXqJyFbSYwaBL5EDz.jpg"
            />
        </div>
      </div>
      <div className="HomePagePresentation-logo">
        <DefaultHeaderLogo />
      </div>
      <div className="HomePagePresentation-description">
        <Markdown>{t('homePage.presentationMarkdown')}</Markdown>
      </div>
    </div>
  );
}

export default HomePagePresentation;
