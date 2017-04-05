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

## I'm Working on This!

Assign the issue to yourself, and to any others working on with you.
Update the first comment in the issue to point to any related tracking stuff - bugs, repos, etherpads, gists, whatever.
There's no need to track status in the issue, as long as someone interested can find out by looking at the links.

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
