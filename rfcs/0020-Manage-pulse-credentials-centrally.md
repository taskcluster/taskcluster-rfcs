# RFC 20 - Manage pulse credentials centrally
* Comments: [#20](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/20)
* Initially Proposed by: @djmitche

# Summary

We currently configure pulse credentials in each of our services manually - creating a new user in pulseguardian and manually adding the username / password to the service configuration.

## Motivation

In a redeployability scenario, that's a lot of manual configuration of credentials for different services, and differs from how we handle other types of credentials.

# Details

Handle pulse credentials the same way we do AWS, Azure, Sentry, and Statsum credentials: services use TC credentials to request temporary pulse credentials.

This is a little more complicated than those other services, though:
 * rabbitmq does not permit credential expiration, so we must expire things manually
 * we need to terminate running connections on expiration
 * we need to delete queues on expiration
 * the pulseguardian-implied correspndance of usernames to queue/exchange names is different
 * need to monitor queue length
 * ..other things

# Implementation

Tracker: https://bugzilla.mozilla.org/show_bug.cgi?id=1436456
