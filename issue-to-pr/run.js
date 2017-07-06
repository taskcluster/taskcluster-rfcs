'use strict';
const Github = require('github');
const fs = require('mz/fs');
const path = require('path');

const github = new Github({
  Promise: Promise,
});

// We get more ratelimit capacity if we auth
if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
}

const owner = 'taskcluster';
const repo = 'taskcluster-rfcs';

async function getCommentsForIssue({owner, repo, number}) {
  let comments = [];
  let res = await github.issues.getComments({
    owner,
    repo,
    number,
    //per_page: 100
  });

  Array.prototype.push.apply(comments, res.data);
  while (github.hasNextPage(res)) {
    res = await github.getNextPage(res);
    Array.prototype.push.apply(comments, res.data);
  }

  return comments;
}

async function main() {
  let issues = [];
  let res = await github.issues.getForRepo({
    owner,
    repo,
    state: 'all',
    per_page: 100,

  });
  Array.prototype.push.apply(issues, res.data);
  while (github.hasNextPage(res)) {
    res = await github.getNextPage(res);
    Array.prototype.push.apply(issues, res.data);
  }

  for (let {number, id, title, created_at, updated_at, body, url, labels} of issues) {
    created_at = new Date(created_at);
    let year = '' + (created_at.getYear() + 1900);
    let month = created_at.getMonth() + 1;
    month = month > 9 ? ''+month : '0'+month;
    let day = created_at.getDate();
    day = day > 9 ? ''+day : '0'+day;
    let timestamp = [year, month, day].join('-');
    let fixedtitle = title.trim();
    for (let c of ['/', '\\\\', '?', '%', '*', ':', '|', '"', '<', '>']) {
      let pattern = new RegExp('[' + c + ']', 'g');
      fixedtitle = fixedtitle.replace(pattern, '_');
    }
    let filename = `${timestamp} ${fixedtitle}.md`
    let comments = await getCommentsForIssue({owner, repo, number});

    labels = labels.map(x => x.name);

    let state;
    if (labels.includes('Phase: Decided')) {
      state = 'decided';
    } else if (labels.includes('Phase: Proposal')) {
      state = 'proposal';
    } else if (labels.includes('Phase: Final Comment')) {
      state = 'final-comment';
    }


    // NOTE We do not apply any attribution to the body of the issue because
    // it is considered a shared space
    let document = [
      `RFC: ${timestamp} ${title}`,
      '================================================================================',
      `**NOTE**: This RFC was converted from an [issue](${url}) to a PR RFC.`,
      '',
      '',
      'SUMMARY',
      '--------------------------------------------------------------------------------',
      body.replace(/[\r]/g, ''),
      '',
      '',
      'DISCUSSION',
      '--------------------------------------------------------------------------------',
    ].join('\n');
    for (let {body, url, user, updated_at} of comments) {
      document += [
        '',
        `[Comment](${url}) [${user.login}](${user.html_url}) ${updated_at}`,
        '--------------------------------------------------------------------------------',
        body.replace(/[\r]/g, ''),
        '',
        '',
      ].join('\n');
    }

    await fs.writeFile(path.join('..', 'rfcs', filename), document);
    console.log('Wrote: ' + filename);

    /*
     * What we should consider:
     * 
     *  1. Make the issue body (e.g. first comment) the sole contents of the file
     *  2. Create a git branch which adds the file and push it
     *  3. Open a PR using the same title
     *  4. Mark the PR with the same labels that the issue had
     *  5. Instead of adding comments to the file, make a comment in the PR with
     *     attribution and a link to the original comment
     *  6. Close the github issue corresponding to the new PR with a comment redirecting
     *     the reader
     */
  }
}

main().then(console.log, console.error);
