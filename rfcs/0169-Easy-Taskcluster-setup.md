# RFC 169 - Easy Taskcluster Setup
* Comments: [#169](https://github.com/taskcluster/taskcluster-rfcs/pull/169)
* Proposed by: @sarah-clements

# Summary

Make Taskcluster easier to setup into a repository

## Motivation

Currently setting up a Taskcluster config file is confusing compared to its competitors. The [Enhance Taskgraph RFC](https://github.com/mozilla-releng/releng-rfcs/pull/36) will simplify the configuration file needed to get started, but we can go a step further and create a user-friendly experience that will guide the user through setup.

## Assumptions

The solution can be repository host agnostic, but the details of this RFC are based on the Taskcluster integration with Github.

# Details

The taskcluster team has created a quickstart tool for the community cluster (https://community-tc.services.mozilla.com/quickstart) that generates a basic config file. This tool would be expanded for use with any cluster and would make use of the simplified configs from [Enhance Taskgraph RFC](https://github.com/mozilla-releng/releng-rfcs/pull/36), abstracting away worker types and scopes. The redesigned tool would include presets for common use cases such as running javascript tests or python tests and the user would only be required to provide the platforms they build and test on and the commands used to perform various actions. The user should be redirected to this tool once they have installed the app in their repository.

A second part of this task would be to improve the Github Integration section of the Taskcluster docs to provide details around the installation of the community and firefox-ci apps with github.

## Strategy

In order to ensure a strong user experience the design of the expanded quickstart tool should incorporate feedback from a small group of target users. This could be presented to each user in such a way so that the user is observed interacting with the mockup/code (or CLI tool) over a video call and any feedback and observations can be used to guide subsequent iterations (basically, until the feature has reached a point where a majority of users find it intuitive to use).


# Implementation

To be updated after acceptance of RFC.
