'use strict';
const Github = require('github');
const fs = require('mz/fs');
const path = require('path');

const github = new Github({});

// We get more ratelimit capacity if we auth
if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
}

const owner = 'djmitche';
const repo = 'testaroo';

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
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

  let master = await github.gitdata.getReference({owner, repo, ref: 'heads/master'});
  master = await github.gitdata.getCommit({owner, repo, sha: master.data.object.sha});

  for (let {pull_request, number, title, created_at, updated_at, body, url, labels, state, user} of issues) {
    // skip pull requests..
    if (pull_request) {
      continue;
    }
    created_at = new Date(created_at);
    let year = '' + (created_at.getYear() + 1900);
    let month = created_at.getMonth() + 1;
    month = month > 9 ? ''+month : '0'+month;
    let day = created_at.getDate();
    day = day > 9 ? ''+day : '0'+day;
    let timestamp = [year, month, day].join('-');
    let fixedtitle = title.trim().replace(/[^a-zA-Z0-9]+/g, '-');

    labels = labels.map(x => x.name);

    console.log(`working on ${title}`);

    let phase;
    if (labels.includes('Phase: Decided')) {
      phase = 'decided';
    } else if (labels.includes('Phase: Proposal')) {
      phase = 'proposal';
    } else if (labels.includes('Phase: Final Comment')) {
      phase = 'final-comment';
    } else {
      console.log('skipping - not labeled');
      continue;
    }

    if (state !== 'open' && phase !== 'decided') {
      console.log('skipping - closed but not decided');
      continue;
    }

    let filename = `rfcs/${pad(number, 4)}-${fixedtitle}.md`;
    let document = [
      `# RFC ${number} - ${title}`,
      `* Comments: [#${number}](${url})`,
      `* Initially Proposed by: @${user.login}`,
      '',
      body.startsWith('#') ? '' : '# Proposal',
      body.replace(/[\r]/g, ''),
    ].join('\n');

    let blob = await github.gitdata.createBlob({
      owner, repo,
      content: document,
      encoding: 'utf-8',
    });

    let tree = await github.gitdata.createTree({
      owner, repo,
      tree: [
        {path: filename, mode: "100644", type: "blob", sha: blob.data.sha},
      ],
      base_tree: master.data.tree.sha,
    });

    let commit = await github.gitdata.createCommit({
      owner, repo,
      message: `Add RFC #${number}`,
      tree: tree.data.sha,
      parents: [master.data.sha],
    });

    if (state !== 'open') {
      // for closed issues, add to master and comment on the
      // issue

      let ref = await github.gitdata.updateReference({
        owner, repo,
        ref: 'heads/master',
        sha: commit.data.sha,
      });

      // ..and we have a new master
      master = commit;

      await github.issues.createComment({
        owner, repo, number,
        body: `This RFC is stored as [${filename}](https://github.com/${owner}/${repo}/blob/master/${filename})`,
      });
      console.log('committed to master and commented on the issue');
    } else {
      // for open issues, create a PR
      let ref = await github.gitdata.createReference({
        owner, repo,
        ref: `refs/heads/rfc${number}`,
        sha: commit.data.sha,
      });

      let pr = await github.pullRequests.createFromIssue({
        owner, repo,
        issue: number,
        head: `rfc${number}`,
        base: 'master',
      });
      console.log('converted issue to pull request');
    }
  }
}

main().catch(console.error);
