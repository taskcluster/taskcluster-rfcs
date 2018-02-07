# RFC 43 - Get rid of tc-vcs completely
* Comments: [#43](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/43)
* Initially Proposed by: @djmitche

# Proposal
We no longer use tc-vcs for Gecko, but there are a few stragglers still using it.  We have hooks set up to re-generate it periodically, and sometimes those fail.  Let's get rid of it.

[Bug 1364032](https://bugzilla.mozilla.org/show_bug.cgi?id=1364032) was opened on the same topic, but nobody volunteered to do the work :)