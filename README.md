**EXPERIMENTAL** - Dustin is trying this out.  Don't take it too seriously yet!

# TaskCluster RFCs

This repo exists to house proposals for changes to TaskCluster and allow the team to manage their transition from ideas to designs to plans to completed (or to deciding against).

The Git repo itsel fhas no real content -- the interesting stuff is in the [issues](https://github.com/djmitche/taskcluster-rfcs/issues) and the [project](https://github.com/djmitche/taskcluster-rfcs/projects/1).

## Mechanics

### I Have an Idea!

Open an issue! Issues should either be more than a week's work, or potentially controversial.  Anything else can just be filed as a bug (assigned to yourself, of course).

Ideas should have
 * a pretty specific goal: a user story ("Users can..."), dependency ("This will allow ..") or a completion condition ("All services ..");
 * some vague idea of how this might be accomplished, or a few alternatives; and
 * a list of required resources (time, money, people)

You can leave the issue un-assigned.  Shop the issue around to the team to try to get a diversity of opinions on it.

### I Have an Opinion!

Comment on the issue.  The issues themselves are intended to record the discussion on the issue, so that's the right place.

As decisions are made, update the first comment to represent that consensus.

### I Think We Should Do This!

Work with the team to get consensus, and update [the project](https://github.com/djmitche/taskcluster-rfcs/projects/1) with the result of that consensus.

### I'm Working on This!

Assign the issue to yourself, and to any others working on with you. Update the first comment in the issue to point to any related stuff - bugs, repos, etherpads, gists, whatever. There's no need to update the issue with status -- that should be visible via the links.

## Labels

* `gecko-migration` -- related to the migration of Gecko fully to TC.  These need not be *blockers* to the migration, just related.
* `good-student-project` -- something good for GSoC, Outreachy, an intern, or a committed contributor>
* `ktlo` -- Keeping The Lights On: internally focused improvements to help keep us going, but with little user-visible impact>
* `r14y` -- redeployability: related to the ability to deploy an entire taskcluster instance. Note that we do not intend to support external redeployments of taskcluster: this is for development and staging purposes only.
* `tc-1.0` -- User-visible features and feature completeness. This can include redesigns of existing features.
* `TCaaS` -- Taskcluster as a service: additional functionality that will allow us to serve a broad array of projects
