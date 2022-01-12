/* eslint-disable no-console */

import { EOL } from 'os';
import axios from 'axios';
import semver from 'semver';
import { promisify } from 'util';
import ghreleases from 'ghreleases';
import axiosRetry from 'axios-retry';
import { cleanEnv, str } from 'envalid';
import gitSemverTags from 'git-semver-tags';
import commitsBetween from 'commits-between';

export function ensureIsValidSemverTag(tag) {
  if (!semver.valid(tag)) {
    throw new Error(`Tag ${tag} is not a valid semver string`);
  }
}

export async function createReleaseNotesFromCurrentTag({ jiraBaseUrl = null, jiraProjectKeys = [] }) {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY } = cleanEnv(process.env, {
    GITHUB_SERVER_URL: str({ default: '' }),
    GITHUB_REPOSITORY: str({ default: '' })
  });

  const githubBaseUrl = GITHUB_SERVER_URL && GITHUB_REPOSITORY
    ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}`
    : null;

  const [currentTag, previousTag] = await promisify(gitSemverTags)();

  const commits = previousTag
    ? await commitsBetween({ from: previousTag, to: currentTag })
    : await commitsBetween();

  const replacers = [];
  const replacedJiraIssueKeys = new Set();
  const replacedGithubIssueKeys = new Set();

  if (jiraBaseUrl && jiraProjectKeys?.length) {
    replacers.push(text => text.replace(new RegExp(`(${jiraProjectKeys.join('|')})-\\d+`, 'g'), issueKey => {
      replacedJiraIssueKeys.add(issueKey);
      return `[${issueKey}](${jiraBaseUrl}/browse/${issueKey})`;
    }));
  }

  if (githubBaseUrl) {
    replacers.push(text => text.replace(/#\d+/g, issueKey => {
      replacedGithubIssueKeys.add(issueKey);
      return `[\\${issueKey}](${githubBaseUrl}/pull/${issueKey.replace(/^#/, '')})`;
    }));
  }

  const commitListMarkdown = commits.map(commit => {
    const message = replacers.reduce((text, replace) => replace(text), commit.subject);
    const sha = githubBaseUrl
      ? `[${commit.commit.short}](${githubBaseUrl}/tree/${commit.commit.short})`
      : commit.commit.short;

    return `* ${message} (${sha})${EOL}`;
  }).join('');

  const releaseNotes = githubBaseUrl && previousTag
    ? `${commitListMarkdown}${EOL}[View all changes](${githubBaseUrl}/compare/${previousTag}...${currentTag})${EOL}`
    : commitListMarkdown;

  return {
    currentTag,
    releaseNotes,
    jiraIssueKeys: [...replacedJiraIssueKeys].sort(),
    githubIssueKeys: [...replacedGithubIssueKeys].sort()
  };
}

export async function createGithubRelease({ githubToken, currentTag, releaseNotes, files = [] }) {
  const { GITHUB_REPOSITORY, GITHUB_ACTOR } = cleanEnv(process.env, {
    GITHUB_REPOSITORY: str(),
    GITHUB_ACTOR: str()
  });

  const [githubOrgaName, githubRepoName] = GITHUB_REPOSITORY.split('/');

  const githubAuth = {
    user: GITHUB_ACTOR,
    token: githubToken
  };

  console.log(`Creating Github release ${currentTag}`);
  const release = await promisify(ghreleases.create)(githubAuth, githubOrgaName, githubRepoName, {
    // eslint-disable-next-line camelcase
    tag_name: currentTag,
    name: currentTag,
    body: releaseNotes,
    prerelease: !!semver.prerelease(currentTag)
  });

  if (files?.length) {
    console.log(`Uploading assets to Github release ${currentTag}`);
    await promisify(ghreleases.uploadAssets)(githubAuth, githubOrgaName, githubRepoName, release.id, files);
  }
}

export async function createLabelInJiraIssues({ jiraBaseUrl, jiraUser, jiraApiKey, jiraIssueKeys, label }) {
  const client = axios.create({ baseURL: jiraBaseUrl });
  axiosRetry(client, { retries: 3 });

  const errors = [];

  for (const issueKey of jiraIssueKeys) {
    console.log(`Setting label ${label} on JIRA issue ${issueKey}`);
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.put(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
        { update: { labels: [{ add: label }] } },
        { responseType: 'json', auth: { username: jiraUser, password: jiraApiKey } }
      );
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length) {
    const message = `${errors.length} ${errors.length === 1 ? 'error' : 'errors'} while trying to create JIRA labels`;
    // eslint-disable-next-line no-undef
    throw new AggregateError(errors, message);
  }
}
