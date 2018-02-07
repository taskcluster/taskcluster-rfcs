# RFC 100 - taskcluster-totp for protecting high-risk scopes
* Comments: [#100](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/100)
* Initially Proposed by: @jonasfj

# Proposal
This might not be the sudo-like solution we're looking for. But it's simple and plausibly useful for protecting scopes where LDAP/auth0/duo isn't sufficient.

API
```
GET /v1/device      // enroll a new device
response: {
  roleId: 'totp:<deviceId>'
  secret: '<toptSecret>'
  // not sure... maybe we require an email property too, and an assume:email:<email> scope
}

POST /v1/device/<deviceId>/credentials     // perform 2FA step
scopes: 'totp:<deviceId>'  // not sure... maybe we require an assume:email:<email> scope
request: {
  token: '<oneTimeToken>'
}
response: {
  // temporary credentials for the scope: "assume:totp:<deviceId>"
  credentials: {clientId: '...', accessToken: '...',  certificate: '...'},
}
```

**Implementation details**, we do not need to store `deviceIds` or `totpSecrets` in the taskcluster-totp service. We simply store a single `SECRET_KEY` in the environment variables for the app.
When a new device is enrolled we use a cryptographically random slugid as `deviceId`, we then compute the `totpSecret` as `totpSecret = HMAC(deviceId, SECRET_KEY)`.

Notice that this service only needs the scope `assume:totp:*`, no database or storage of any kind, beyond a single `SECRET_KEY` given through heroku environment variables.

**limitation**, this means that `totp:*` is needed for setting up this thing.. and that protected scopes can't be passed to other groups... On the upside that's kind of the whole point. You protect the scopes bound to the role `assume:totp:<deviceId>` to a specific TOTP device.

---
IMO, this only really useful for the few cases where LDAP/tc-login should not be a trust point.

Given that it's potentially a super simple service, I think this is something we can try out, if we feel like playing around some rainy day.