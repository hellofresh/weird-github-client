<p align="center">
  <a href="https://hellofresh.com">
    <img width="120" src="https://www.hellofresh.de/images/hellofresh/press/HelloFresh_Logo.png">
  </a>
</p>

# hellofresh/weird-github-client

Weird GitHub client automates some tasks on GitHub via it's API. It does... stuff.

`./bin/check-four-eyes.js`

Generates a `.tsv` file listing all the PR's in a repo.
It also checks if the author of the PR is the one merging it.
If so, one of the columns will have the value `KO`.
If, on the other hand, the user merging the PR is different one than it's author, it'll say `OK`.

`./bin/developer-stats.js`

Crawls through all the repos in your organization.

It outputs a text that summarizes:
- how many commits, changed lines and average changed lines per commit each developer has done over the current week.
- how many commits, changed lines and average changed lines per commit have been done in each repo over the current week.
- it only accounts for changes done to the *repo's default branch*.

It outputs that summary to the console, and, if configured properly (via `.env`) it also publishes this info to a slack channel.

`./bin/spawn-technical-test.js`

Creates a new private repo in your organization, based on an existing repo (`hellofresh/{candidate}-{existing-repo}`);
Shares it with a code reviewing team in your organization.
Shares it with a github user.

We use it at HelloFresh to bootstrap a private repo with the technical test for our candidates, based on an existing repo. 
You might not need this at all, because forking would do the trick in 99% of the cases.
However, if it does fit your purposes, feel free to use it.

`./bin/archive-technical-test.js`

Archives a candidate's test branch into a an archive repository, and if needed, deletes the candidate's repo.

# Usage

1. Generate your own GitHub API token here: https://github.com/settings/tokens/new. The token must have the `repo` and `admin:org` scopes. For the `./bin/archive-technical-test.js` you should add the `delete_repo` scope, in case you want to delete the repo after archived.

2. Copy the `.env.dist` file to `.env`. 

3. Add the GitHub token to your `.env` file, plus some sane defaults that fit your scenario.

4. Run one of the above mentioned commands.

5. follow the prompt.

## Requisites

`npm`.

Have fun!

HelloFresh - More Than Food.

