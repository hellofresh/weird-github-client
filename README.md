# hellofresh/duplicate-repo

In short, this command:

1. creates a new private repo in your organization (ex. `hellofresh/{candidate}-{test-name}`);
2. associates it with a code reviewing team
3. shares the repo with a github user

This command is used to bootstrap a technical test repo for our candidates.
The candidate then submits his code to that repo's `dev` branch and creates a PR to `master` that our engineers will review.

If it fits your purposes, feel free to use it.

HelloFresh
More Than Food.

# usage

Copy the `.env.dist` file to `.env` and add your github API token, as well as your default configs.

IMPORTANT: The github token must have the `repo` and `admin:org` scopes.

```
./bin/index.js
```

Then just follow the prompt.

## Requisites

`npm`.


