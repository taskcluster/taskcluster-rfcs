**EXPERIMENTAL** - Dustin is trying this out.  Don't take it too seriously yet!

# TaskCluster RFCs

**What**: Ideas and projects of the TaskCluster Team, in one discoverable place.

**Why**: This repo serves as a place to coordinate design and architecture, so that everyone can participate ([issues](https://github.com/djmitche/taskcluster-rfcs/issues) ).
It is also a place to figure out when we will make those designs into reality ([Taskcluster Backlog](https://github.com/djmitche/taskcluster-rfcs/projects/1)).

The Git repo itself has no real content -- the interesting stuff is in the [issues](https://github.com/djmitche/taskcluster-rfcs/issues) and the [project](https://github.com/djmitche/taskcluster-rfcs/projects/1).

## Mechanics

So, how do I use this?

### I Have an Idea!

Open an issue! Issues should either be more than a week's work, or potentially controversial.  Anything else can just be filed as a bug (assigned to yourself, of course).

Ideas should have
 * a pretty specific goal: a user story ("Users can..."), dependency ("This will allow ..") or a completion condition ("All services ..");
 * some vague idea of how this might be accomplished, or a few alternatives; and
 * a list of required resources (time, money, people)

You can leave the issue un-assigned.
Shop the issue around to the team to try to get a diversity of opinions on it.
It's OK to leave ideas open, too, awaiting their time.

### I Have an Opinion!

Comment on the issue.
The issues are intended to record the discussion on the idea, so that's the right place.

As decisions are made, update the first comment to represent that consensus.

### I Think We Should Do This!

Work with the team to figure out when it should be done and by whom, and update the [Taskcluster Backlog](https://github.com/djmitche/taskcluster-rfcs/projects/1) with the result.

### I'm Working on This!

Assign the issue to yourself, and to any others working on with you.
Update the first comment in the issue to point to any related stuff - bugs, repos, etherpads, gists, whatever.

Keep the first comment updated with status of the work on a weekly basis.
That can be in the form of a checkbox list, a few sentences, or a link to a bug or other tool you're using to track progress.

## Labels

* `blocked` -- the issue depends on some other work that is not ready yet; there's nothing to do here
* `ongoing` -- the issue is ongoing across multiple months (and should probably be broken up...)
* `gecko-migration` -- related to the migration of Gecko fully to TC.  These need not be *blockers* to the migration, just related.
* `good-student-project` -- something good for GSoC, Outreachy, an intern, or a committed contributor>
* `ktlo` -- Keeping The Lights On: internally focused improvements to help keep us going, but with little user-visible impact>
* `r14y` -- redeployability: related to the ability to deploy an entire taskcluster instance. Note that we do not intend to support external redeployments of taskcluster: this is for development and staging purposes only.
* `tc-1.0` -- User-visible features and fixes for papercuts. This can include redesigns of existing features.
* `TCaaS` -- Taskcluster as a service: additional functionality that will allow us to serve a broad array of projects
