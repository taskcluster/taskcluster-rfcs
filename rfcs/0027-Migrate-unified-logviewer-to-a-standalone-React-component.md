# RFC 27 - Migrate unified-logviewer to a standalone React component
* Comments: [#27](https://github.com/taskcluster/taskcluster-rfcs/pull/27)
* Initially Proposed by: @eliperelman

# Proposal
To relieve some CORS and hosting issues, the Unified Logviewer needs to move away from being hosted in an iframe on GitHub pages, and into a standalone React component that can be imported into the relevant application. Depends on #25.