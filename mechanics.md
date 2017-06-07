# Mechanics

So, how do I use this?

## I Have an Idea!

Open an issue! Issues should either be more than a week's work, or potentially controversial.  Anything else can just be filed as a bug (assigned to yourself, of course).

Ideas should have
 * a pretty specific goal: a user story ("Users can..."), dependency ("This will allow ..") or a completion condition ("All services .."); and
 * some vague idea of how this might be accomplished, or a few alternatives.

The first comment will get edited as the idea evolves, so try to stick to the facts there, and add discussion in later comments.

You can leave the issue un-assigned, or assign it to yourself if you intend to champion it.
Shop the issue around to the team to try to get a diversity of opinions on it.
It's OK to leave ideas open indefinitely, awaiting their time.

## I Have an Opinion!

Comment on the issue.
The issues are intended to record the discussion on the idea, so that's the right place.

As decisions are made, the assignee will update the first comment to represent that consensus.

## Let's Decide!

First, once the RFC has a clear proposal in the first comment, label it `Phase: Proposal`.

Now get anybody you know will care about this on-board quickly by contacting
them by whatever means you want: irc, email, @ mentions should all work well.
As early as possible, get an email out to the tools-tc list if this is going to
be something more than a couple specific people care about. Use your best
judgement.  Give a few days for opinions to filter in. Respond promptly if
possible to avoid a confusing conversation but give enough time for people who
are PTO or busy etc.  The idea here is to work out any disagreement and come to
a proposal everyone can live with, so modify the proposal as necessary.
Reaching consensus is unlikely, but compromise is always possible.

When you feel that everyone is on the same page, it's time for the
final-comment period.  The intent of this phase is to allow someone to speak up
and say, "uh, no, that's not what I thought we decided as a group" or "I wasn't
aware of this proposal, that's crazy", so notification should be distributed
broadly.  The phase should last long enough for everyone to read the summary
and speak up, taking into account timezones, PTO, and email backlogs - use your
best judgement.

Update the issue's label to `Phase: Final Comment` and send a note summarizing
the proposal and indicating the duration for comments to the tools-taskcluster
list, or to some other appropriate venue.

When the final comment period has expired, if there have been no objections,
mark the issue as `Phase: Decided`.  Note that it's OK to have decided RFCs
which aren't being actively worked on.

## Let's Do It!

Assign the issue to yourself, and to any others working on with you.
Update the first comment in the issue to point to any related tracking stuff - bugs, repos, etherpads, gists, whatever.
There's no need to track status in the issue, as long as someone interested can find out by looking at the links.

When the implementation is complete, close the RFC.

## Labels

Labelling issues helps others find them

* `blocked` -- the issue depends on some other work that is not ready yet; there's nothing to do here
* `gecko-migration` -- related to the migration of Gecko fully to TC.  These need not be *blockers* to the migration, just related.
* `good-student-project` -- something good for GSoC, Outreachy, an intern, or a committed contributor
* `ktlo` -- Keeping The Lights On: internally focused improvements to help keep us going, but with little user-visible impact>
* `r14y` -- redeployability: related to the ability to deploy an entire taskcluster instance. Note that we do not intend to support external redeployments of taskcluster: this is for development and staging purposes only.
* `tc-1.0` -- User-visible features and fixes for papercuts. This can include redesigns of existing features.
* `TCaaS` -- Taskcluster as a service: additional functionality that will allow us to serve a broad array of projects
* `frontend` -- relating to the TC frontend: any of its browser interfaces

## Milestones

We use milestones to sort ideas based on when we would like to implement them.
This isn't a commitment, or a work-tracking system -- just a way to get a picture of "now" vs. "later".
