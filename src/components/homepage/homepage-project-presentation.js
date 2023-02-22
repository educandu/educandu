import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useSettings } from '../settings-context.js';
import MediaPlayer from '../media-player/media-player.js';
import DefaultHeaderLogo from '../default-header-logo.js';

function HomepageProjectPresentation({ logo }) {
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('homepageProjectPresentation');

  const aboutPageDocumentId = settings?.aboutPage?.[uiLanguage]?.documentId || 'cTfhXcxtkgqYLE3k1P6JAR';
  const videoSourceUrl = settings?.homepagePresentation?.[uiLanguage]?.video?.sourceUrl || 'https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/oma-explainer-vs1-0-pDjYtJexVC91WfrtWnu6hh.mp4';
  const videoPosterImageUrl = settings?.homepagePresentation?.[uiLanguage]?.video?.posterImageUrl || 'https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/explainer-poster-4c1tzNXqJyFbSYwaBL5EDz.jpg';

  const handleLearnMoreClick = () => {
    window.location = routes.getDocUrl({ id: aboutPageDocumentId });
  };

  return (
    <div className="HomepageProjectPresentation">
      {!!videoSourceUrl && (
        <div className="HomepageProjectPresentation-videoWrapper">
          <div className="HomepageProjectPresentation-video">
            <MediaPlayer
              renderControls={() => null}
              renderProgressBar={() => null}
              sourceUrl={videoSourceUrl}
              posterImageUrl={videoPosterImageUrl}
              />
          </div>
        </div>
      )}
      <div className="HomepageProjectPresentation-details">
        {logo || <DefaultHeaderLogo />}

        <div className="HomepageProjectPresentation-description">
          <Markdown>{t('descriptionMarkdown')}</Markdown>
        </div>

        {!!aboutPageDocumentId && (
          <Button size="large" onClick={handleLearnMoreClick}>{t('learnMore')}</Button>
        )}
      </div>
    </div>
  );
}

HomepageProjectPresentation.propTypes = {
  logo: PropTypes.node
};

HomepageProjectPresentation.defaultProps = {
  logo: null
};

export default HomepageProjectPresentation;
