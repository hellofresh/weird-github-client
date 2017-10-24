<p align="center">
  <a href="https://hellofresh.com">
    <img width="120" src="https://www.hellofresh.de/images/hellofresh/press/HelloFresh_Logo.png">
  </a>
</p>

# hellofresh/weird-github-client

### Deprecated in favour of [github-cli](https://github.com/hellofresh/github-cli)

Weird GitHub client automates some tasks on GitHub via it's API.

`./bin/archive-repo.js`

Archives a repo's branch into an archive repository, and if needed, deletes the original repo.

`./bin/list-repos.js`

Lists all repos in a github organization.

`./bin/list-teams.js`

Lists all teams with their ID and default permission in a github organization.

`./bin/normalize-repo.js`

Enforces a set of teams to be added to the repo, commits a `.pullapprove.yml` if it does not exist in the repo, and calls the pullapprove.com API to add that repo to pullapprove.

`./bin/set-team-permission.js`

Allows you to change the default github team's permission

`./bin/spawn-test.js`

Spawns a new repo based on another repo and shares it with a collaborator. Particularly useful for creating technical tests for your candidates.

# Usage

1. Generate your own GitHub API token here: https://github.com/settings/tokens/new. The token must have the `repo` and `admin:org` scopes. For `./bin/archive-repo.js` you should add the `delete_repo` scope, in case you want to delete the repo after archived.

2. Copy the `.env.dist` file to `.env`. 

3. Add the GitHub token to your `.env` file, plus some sane defaults that fit your scenario.

4. Run one of the above mentioned commands.

5. follow the prompt.

## Requisites

`npm`.

Have fun!

HelloFresh - More Than Food.

