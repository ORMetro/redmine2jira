# Redmine to Jira Migration
Jira offers a importer plugin (Codename JIM), which also supports Redmine.
However, the import

1. is very slow because not available time entries are fetched for each issue several times (even when disabled) which causes about 2-3h per 10000 issues of additional time to the process
2. does not support the journal entries (except comments) of an issue in Redmine (information about who changed what, e.g. someone set the priority to x)
3. uses issue numbers for the tickets which differ from the original ones in Redmine. All links in commits, issue descriptions as well as in comments are gone.

Since this is rather unacceptable for us, we need a way to solve those problems.

## Approach
The best way to solve this seems to be the JSON import integrated in Jira.
With that it is possible to import all issues with history, comments, relations, ... from Redmine and update the references to other issues in texts like the description or comments.

For additional fanciness, we are using [babel-node](https://babeljs.io/docs/usage/cli/#babel-node) with ES6.

## Preconditions
The following preconditions have to be met for this to work correctly:
1. Jira was started an the setup wizard is finished
2. All users, custom fields, priorities, states, issue types and other used fields are set up
3. The workflow is set up (including screens) and the states are correctly linked to the workflow
4. The project is created and links to the workflow, states, ... are set up correctly

Generally said, the project in Jira should be _ready for productive use_.

After that, the JSON file can be generated with this tool and later be imported using the Jira JSON importer.

**NOTE:
_Create a Backup of your Jira instance before starting the import! 
So you don't have to set it up all again,
because the import did not work out.
You can use ```npm run push-backup``` and ```npm run pull-backup``` if you are using docker_**

## Usage
1. Rename the ```settings.ini.example``` to ```settings.ini``` and adjust it accordingly.
2. Check the mappings in ```entities/jiraIssue``` and . You may need several tries to get it right
3. **Read the code and understand what is happening**
4. Run ```npm start```

## Steps
1. All issues including journals and attachment information are downloaded from the Redmine server.
2. Users are extracted from the issue fields and a mapping from Redmine to Jira users is generated.
3. Redmine issues are converted to Jira issues using the mappings.
4. The JSON file for the import to Jira is generated.

## Misc
There are npm scripts available for easy testing with docker.
Check out ```package.json``` for more information.

The ```attachmentServer.js``` is basically a proxy for adding additional authorization headers.
I had to use this, because our redmine server is protected with an additional basic authentication.
It will redirect request for attachments to the redmine server.