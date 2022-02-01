/**
 * The singleton instance of this class
 */
'use strict';

import Request from 'request-promise-native';
import Settings from "../settings";

/**
 * The url of the Jira server
 */
const BASE_URL = Settings.getJiraHost();

/**
 * The basic authorization header
 */
const AUTHORIZATION_HEADER = new Buffer.from(`${Settings.getJiraUser()}:${Settings.getJiraPassword()}`).toString('base64');

/**
 * Class for interaction with the Jira REST API.
 * See https://developer.atlassian.com/static/rest/jira/6.1.html#resources for documentation.
 */
export default class JiraConnector {

    /**
     * Returns the Jira user for the given login
     *
     * @param {string} login The id of the user in redmine
     */
    static findUser(login) {
        return getRequest(`/rest/api/2/user?username=${login}`);
    }

    /**
     * Returns all issue fields configured in Jira
     * @return {Promise}
     */
    static getIssueFields() {
        return getRequest('/rest/api/2/field');
    }

    /**
     * Returns all priorities configured in Jira
     * @return {Promise}
     */
    static getPriorities() {
        return getRequest('/rest/api/2/priority');
    }

    /**
     * Returns all issue types configured in Jira
     * @return {Promise}
     */
    static getIssueTypes() {
        return getRequest('/rest/api/2/issuetype');
    }

    /**
     * Creates a user on the Jira server with the given details
     */
    static createUser(firstName, lastName, email, login) {
        console.info(`Creating user ${firstName} ${lastName} with login \"${login}\" on the Jira server`);
        const options = {
            uri: `${BASE_URL}/rest/api/2/user`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTHORIZATION_HEADER}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: {
                name: login,
                emailAddress: email,
                displayName: `${firstName} ${lastName}`
            },
            json: true
        };
        return Request(options)
            .then(function (user) {
                return Promise.resolve(user);
            })
            .catch(error => console.error(error.message));
    }
}


/**
 * Sends a GET request to the jira server on the given uri
 *
 * @param {!string} url The uri to request starting with /
 * @return {Promise} A promise with the parsed response object
 */
function getRequest(url) {
    const options = {
        uri: BASE_URL + url,
        headers: {
            'Authorization': `Basic ${AUTHORIZATION_HEADER}`
        },
        json: true
    };
    return Request(options);
}