/**
 * The singleton instance of this class
 */
'use strict';

import Request from 'request-promise-native';
import Settings from "../settings";
import http from 'http';

/**
 * HTTP Agent used to limit concurrent requests
 */
const httpAgent = new http.Agent();
httpAgent.maxSockets = 5;

/**
 * Url of the Redmine server
 * @type {string}
 */
const BASE_URL = Settings.getRedmineHost();

/**
 * API key for the Redmine server
 * @type {string}
 */
const API_KEY = Settings.getRedmineApiKey();

/**
 * The basic authorization header for Jira
 */
const AUTHORIZATION_HEADER = new Buffer(`${Settings.getJiraUser()}:${Settings.getJiraPassword()}`).toString('base64');

/**
 * The redmine project
 */
const project = Settings.getRedmineProject();

/**
 * List of versions
 */
let versions = null;

/**
 * Class for interaction with the Redmine REST API.
 * See https://www.redmine.org/projects/redmine/wiki/Rest_api for documentation.
 */
export default class RedmineConnector {
    /**
     * Returns all issues
     */
    static getIssues() {
        return getTotalIssueCount()
            .then(function (issueCount) {
                console.info(`Loading ${issueCount} issues`);
                return bulkFetch(`/projects/${project}/issues.json?status_id=*`,
                    issueCount, 'issues');
            })
            .then(function (issues) {
                console.info(`Fetching details for ${issues.length} issues`);
                const promises = [];

                for (let i = 0; i < issues.length; i++) {
                    promises.push(getRequest(`/issues/${issues[i]['id']}.json?include=journals,attachments,relations`)
                        .then(function (issue) {
                            console.info(`${i}/${issues.length}`);
                            return Promise.resolve(issue['issue']);
                        }));
                }

                return Promise.all(promises);
            });
    }

    /**
     * Gets the versions for the project from the Redmine server
     */
    static getVersions() {
        return getRequest(`/projects/${project}/versions.json`)
            .then(function(result) {
                return Promise.resolve(result['versions']);
            });
    }

    /**
     * Gets the available issue states from the Redmine server
     */
    static getIssueStates() {
        return getRequest(`/issue_statuses.json`)
            .then(function(result) {
                return Promise.resolve(result['issue_statuses']);
            });
    }

    /**
     * Gets the available tracker types from the Redmine server
     */
    static getTrackerTypes() {
        return getRequest(`/trackers.json`)
            .then(function(result) {
                return Promise.resolve(result['trackers']);
            });
    }

    /**
     * Gets the available tracker types from the Redmine server
     */
    static getCustomFields() {
        return getRequest(`/custom_fields.json`)
            .then(function(result) {
                return Promise.resolve(result['custom_fields']);
            });
    }

    /**
     * Gets the available priorities from the Redmine server
     */
    static getPriorities() {
        return getRequest(`/enumerations/issue_priorities.json`)
            .then(function(result) {
                return Promise.resolve(result['issue_priorities']);
            });
    }

    /**
     * Gets the available categories from the Redmine server
     */
    static getCategories() {
        return getRequest(`/projects/${project}/issue_categories.json`)
            .then(function(result) {
                return Promise.resolve(result['issue_categories']);
            });
    }

    /**
     * Returns all Redmine users
     */
    static getRedmineUsers() {
        return getTotalUserCount()
            .then(function (userCount) {
                console.info(`Loading ${userCount} users from the Redmine server`);
                return bulkFetch('/users.json?status=', userCount, 'users');
            });
    }
}

/**
 * Returns the total amount of issues
 */
function getTotalIssueCount() {
    return getRequest(`/projects/${project}/issues.json?status_id=*&limit=1`)
        .then(function (response) {
            return Promise.resolve(response['total_count']);
        });
}

/**
 * Returns the total amount of users in Redmine
 */
function getTotalUserCount() {
    return getRequest(`/users.json?status=&limit=1`)
        .then(function (response) {
            return Promise.resolve(response['total_count']);
        });
}

/**
 * Bulk fetches entries from the given url
 *
 * @param {string} url The url to fetch from
 * @param {number} totalCount Total count of entries fetched, rounded up to the next 100
 * @param {string} fieldName The name of the field which should be returned
 */
function bulkFetch(url, totalCount, fieldName) {
    const promises = [];

    for (let offset = 0; offset <= totalCount; offset += 100) {
        promises.push(
            getRequest(`${url}&offset=${offset}&limit=100`)
                .then(function (response) {
                    console.info(`${offset}/${totalCount}`);
                    return Promise.resolve(response[fieldName]);
                }));
    }
    return Promise.all(promises)
        .then(function (resultArrays) {
            return Promise.resolve([].concat.apply([], resultArrays));
        });
}

/**
 * Sends a GET request to the redmine server on the given uri
 *
 * @param {!string} url The uri to request starting with /
 * @return {Promise} A promise with the parsed response object
 */
function getRequest(url) {
    const options = {
        uri: BASE_URL + url,
        headers: {
            'X-Redmine-API-Key': API_KEY
        },
        json: true,
        pool: httpAgent
    };
    return Request(options);
}