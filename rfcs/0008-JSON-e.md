# RFC 8 - JSON-e
* Comments: [#8](https://github.com/taskcluster/taskcluster-rfcs/pull/8)
* Initially Proposed by: @djmitche

# Proposal
JSON-e is a language for parameterizing data structures. It should be the standard way that TaskCluster tasks are generated from templates (replacing rudimentary text substitution in YAML or JSON files).

https://github.com/taskcluster/json-e

This involves both implementing JSON-e itself, and deploying it for use in a bunch of contexts:

* JS implementation
  * TC-Github's .taskcluster.yml
  * Mozilla-taskcluster's .taskcluster.yml
  * TC-Hooks
    * Schedule in response to pulse messages, parameterized on their content (could replace mozilla-taskcluster!!)
    * Allow triggerTask calls to include a payload which is used to parameterize the task
* Python Implementation
  * Parameterizing Decision, Action, and Cron Tasks (in-tree)
  * Re-parameterizing decision tasks in Chain-of-trust validation (scriptworker)

Implementation Tracking: [bug 1372600](https://bugzilla.mozilla.org/show_bug.cgi?id=1372600)