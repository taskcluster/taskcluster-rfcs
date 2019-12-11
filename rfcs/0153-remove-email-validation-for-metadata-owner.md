# RFC 153 - remove the email validation for metadata.owner
* Comments: [#153](https://github.com/taskcluster/taskcluster-rfcs/pull/153)
* Proposed by: @mihaitabara

# Summary

We want to remove the email validation for `metadata.owner` to allow Github applications to safely
set their names within the fields used in `.taskcluster.yml` without breaking the CI automation.

## Motivation

Using Github bots has become a necessity in many repositories that are already using Taskcluster as their CI. Many of these bots set some of the context input fed in `.taskcluster.yml` without an easy way to tweak it.
One of these examples is the `event.sender.login` which may be directly inferred from the bot without the possibility of configuring it. Since this field is often used to feed the `metadata.owner` with an email address, it
can often break taskcluster-gitub logic.

Removing the email validation causes no harm and avoids `if/else` statements that attempt to guess and re-write that field directly in the `.taskcluster.yml`, making it more suple and easy to read.

# Details

In the Github world, there are some helpful applications that are running in order to help developers. Examples include but are not limited to [dependabot](https://dependabot.com/) and [bors](https://github.com/bors-ng/bors-ng) which are used successfully
in projects such as [application-services](https://github.com/mozilla/application-services/) or [android-components](https://github.com/mozilla-mobile/android-components/). When `taskcluster-github` is rendering the `.taskcluster.yml`,
it sometimes hits errors when validating the email set for `metadata.owner`. Normally that field is set to `${user}@users.noreply.github.com` where `user = ${event.sender.login}`.
For primitive github operations, sans bots, this works well while for cron-jobs triggered from hooks, we feed that value to our covenience. However, for when we're using bots, we may not always have that flexibility of tweaking the bot's input.
Moreover, Github itself is adding the `[bot]` string to that input, which naturally breaks any sort of email validator we have under the hood.

In order to make checks such as [this](https://github.com/mozilla/application-services/blob/b4750f6c0987d76893f96ecbb2123552e6b35252/.taskcluster.yml#L43-L48) and
[this](https://github.com/mozilla-mobile/android-components/pull/4097/files#diff-ac0229d1171c0983b27003af4c7441a5R12-R16) more generic (if we end up adding multiple bots for a repo), we propose removing the email validation for `metadata.owner`.


To our knowledge, the `metadata.owner` holds no security concern, so removing the email validation should be harmless.

# Implementation

* [general bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1573192)
