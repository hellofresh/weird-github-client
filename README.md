<p align="center">
  <a href="https://hellofresh.com">
    <img width="120" src="https://www.hellofresh.de/images/hellofresh/press/HelloFresh_Logo.png">
  </a>
</p>

# hellofresh/weird-github-client

This client has 2 commands, that you can interact with on the command line.

`./bin/check-four-eyes.js`

Generates a `.tsv` file listing all the PR's in a repo.
It also checks if the author of the PR is the one merging it.
If so, one of the columns will have the value `KO`.
If, on the other hand, the user merging the PR is different one than it's author, it'll say `OK`.


`./bin/spawn-technical-test.js`

Creates a new private repo in your organization, based on an existing repo (`hellofresh/{candidate}-{existing-repo}`);
Shares it with a code reviewing team in your organization.
Shares it with a github user.

We use it at HelloFresh to bootstrap a private repo with the technical test for our candidates, based on an existing repo. 
You might not need this at all, because forking would do the trick in 99% of the cases.
However, if it does fit your purposes, feel free to use it.

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


Have fun!

HelloFresh - More Than Food.

