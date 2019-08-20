# RFC 43 - Get rid of tc-vcs completely
* Comments: [#43](https://github.com/taskcluster/taskcluster-rfcs/pull/43)
* Initially Proposed by: @djmitche

# Proposal

We no longer use tc-vcs for Gecko, but there are a few stragglers still using it.  We have hooks set up to re-generate it periodically, and sometimes those fail.  Let's get rid of it.

# Implementation

* [Bug 1364032](https://bugzilla.mozilla.org/show_bug.cgi?id=1364032) was opened on the same topic, but nobody volunteered to do the work :)
* [Bug 1409260](https://bugzilla.mozilla.org/show_bug.cgi?id=1409260) is removing some uses of tc-vcs that remain in trunk.
* [Bug 1435804](https://bugzilla.mozilla.org/show_bug.cgi?id=1435804) tracks actually turning tc-vcs off
