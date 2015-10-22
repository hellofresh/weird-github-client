# hellofresh/duplicate-repo

Main purpose of this repo is to automate the creation of a new private repo for candidates to submit their technical tests.

# usage

Copy the `.env.dist` file to `.env` and add your github api token there.

IMPORTANT: The token must have the `repo` and `admin:org` scopes.

```
./bin/index.js

```

You will be asked for a repo name. You probably want to use `backend-test`, `frontend-test`, `ios-test`, `android-test`, `data-engineering-test`, `data-science-test`, etc...

The second prompt is for you to add the candidate's github username, which someone from HR must have given to you.

And that's it.

## Requisites

You must have `npm` installed.


