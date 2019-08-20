# RFC 24 - Decouple components from routing mechanisms
* Comments: [#24](https://github.com/taskcluster/taskcluster-rfcs/pull/24)
* Initially Proposed by: @eliperelman

# Proposal
In order support deep linking of components in UIs, we need to decouple these components from the URL used to access them. This will allow us to rearrange the interface without having to refactor the component every time.

The concrete outcome of this task will be that taskcluster-tools will have some higher-order component to glue a UI component to the URL and react-router.