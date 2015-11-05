# hellofresh/duplicate-repo

In short, this command:

1. Creates a new private repo in your organization, based on an existing repo (`hellofresh/{candidate}-{existing-repo}`);
2. Associates it with a code reviewing team;
3. Shares the repo with a github user.

We use it at HelloFresh to bootstrap a private repo with the technical test for our candidates, based on an existing repo. 

You might not need this at all, because forking works 99% of the cases.

However, if it does fit your purposes, feel free to use it.

HelloFresh - More Than Food.

# Usage

1. Generate your own GitHub API token here: https://github.com/settings/tokens/new. The token must have the `repo` and `admin:org` scopes.

2. Copy the `.env.dist` file to `.env`. 

3. Add the GitHub token to your `.env` file, plus some sane defaults that fit your scenario.

4. Run
```
./bin/index.js
```

Then just follow the prompt.

## Requisites

`npm`.

