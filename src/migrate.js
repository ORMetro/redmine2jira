/**
 * Generates Jira issues from the given Redmine issues
 * @param redmineIssues
 * @return {Promise<Array.<JiraIssue>>} The generated {@link JiraIssue}s.
 */
'use strict';

import RedmineConnector from './connectors/redmine';
import Settings from './settings';
import fs from 'fs';
import JiraIssue from "./entities/jiraIssue";
import Mappings from "./mappings/mappings";
import UserMappings from "./mappings/userMappings";

let issuePromise;

try {
    issuePromise = Promise.resolve(require('../issues.json'));
    console.info('Using issues.json');
} catch (error) {
    issuePromise = RedmineConnector.getIssues()
        .then(function (issues) {
            fs.writeFile('issues.json', JSON.stringify(issues),
                function(err, result) {
                if(err) console.log('error', err);
            });

            return Promise.resolve(issues);
        })
}

issuePromise
    .then(saveIssues)
    .then(Mappings.generateMappings)
    .then(generateJiraIssues)
    .then(createWrapperObject)
    .then(addVersions)
    .then(addComponents)
    .then(addLinks)
    .then(exportToJsonFile)
    // The line below will generate users in Jira and email people to invite them to join the project
    // .then(UserMappings.addUsersToJira)
    .then(function () {
        // You may like to debug Mappings
        // console.log(Mappings);
        console.log('Done');
    })
    .catch(error => {
        console.error(error);
    });


function generateJiraIssues(redmineIssues) {
    const jiraIssues = [];
    console.info('Generating Jira Issues');
    for (let i = 0; i < redmineIssues.length; i++) {
        const redmineIssue = redmineIssues[i];
        jiraIssues.push(new JiraIssue(redmineIssue));
    }

    return Promise.resolve(jiraIssues);
}

/**
 * Creates a wrapper object compatible to the JSON file import format of Jira
 */
function createWrapperObject(jiraIssues) {
    return Promise.resolve({
        projects: [{
            key: Settings.getJiraProjectKey(),
            issues: jiraIssues
        }]
    });
}

function addVersions(wrapperObject) {
    return RedmineConnector.getVersions()
        .then(function (versions) {
            wrapperObject.projects[0].versions = versions.map(version => {
                return {
                    name: version['name'],
                    releaseDate: version['due_date'],
                    released: version['status'] === 'closed'
                };
            });
            return Promise.resolve(wrapperObject);
        });
}

function addComponents(wrapperObject) {
    return RedmineConnector.getCategories()
        .then(function (categories) {
            wrapperObject.projects[0].components = categories.map(category => {
                if (category['assigned_to']) {
                    return {
                        name: category['name'],
                        lead: UserMappings.mapUserToLogin(category['assigned_to']['id'])
                    };
                }
                return category['name'];
            });
            return Promise.resolve(wrapperObject);
        });
}

function addLinks(wrapperObject) {
    wrapperObject.links = JiraIssue.getLinks();
    return Promise.resolve(wrapperObject);
}

/**
 * Generates a JSON file from the given object.
 *
 * @param wrapperObject
 */
function exportToJsonFile(wrapperObject) {
    console.info('Writing to file');
    fs.writeFile('output.json', JSON.stringify(wrapperObject, null, 2), function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

/**
 * Saves the redmine issue to the issues.json, but does not override a existing file.
 */
function saveIssues(redmineIssues) {
    if (!fs.existsSync('issues.json')) {
        console.info('Saving issues to issues.json');
        fs.writeFile('issues.json', JSON.stringify(redmineIssues, null, 2), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    return Promise.resolve(redmineIssues);
}
