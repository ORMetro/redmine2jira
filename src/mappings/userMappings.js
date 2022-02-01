'use strict';

import JiraConnector from '../connectors/jira';
import RedmineConnector from '../connectors/redmine';

/**
 * Mapping from Redmine user id to Redmine user object.
 *
 * @type {Object}
 */
const userMapping = {
    // Keys hold JSON objects generated from Redmine users
    //     '111': {
    //         id: 111,
    //         login: 'grizzle.barr',
    //         firstname: 'Grizzle',
    //         lastname: 'Barr',
    //         mail: 'grizzle.barr@example.com',
    //         created_on: '2018-09-17T21:56:09Z',
    //         last_login_on: '2022-01-24T18:08:24Z',
    //  inUse must be true if you want to import the use to jira
    //         inUse: true,
    //  jiraId is required to map the user in Jira
    //         jiraId: '8e420i5c001' // sometimes in the format 557058:1a511a-1a51-234c-9a26-00bd8f14ed12
    //     },
};

export default class UserMappings {
    /**
     * Generates the user mapping
     */
    static generateUserMapping() {
        return RedmineConnector.getRedmineUsers()
            .then(function (users) {
                for (let i = 0; i < users.length; i++) {
                    userMapping[users[i]['id']] = users[i];
                }

                return Promise.resolve();
            })
    }

    /**
     * Returns the login of a user
     *
     * @param id The user's Redmine id
     */
    static mapUserToLogin(id) {
        const user = getUser(id);

        if (!user) {
            return null;
        }

        if (!user['login']) {
            console.warn(`User has no login, using id! ${user}`);
            return id;
        }

        return user['login'];
    }

    /**
     * Returns the login of a user
     *
     * @param id The user's Redmine id
     */
    static mapUserToJiraId(id) {
        const user = getUser(id);

        if (!user) {
            return null;
        }

        if (!user['jiraId']) {
            console.warn(`User has no jiraId, using id! ${user}`);
            return id;
        }

        return user['jiraId'];
    }


    /**
     * Returns the full name of a user
     *
     * @param id The user's Redmine id
     */
    static mapUserToName(id) {
        const user = getUser(id);

        if (!user) {
            return null;
        }

        if (!user['firstname'] || !user['lastname']) {
            console.warn(`User has no name, returning empty value! ${user}`);
            return '';
        }

        return `${user['firstname']} ${user['lastname']}`;
    }

    /**
     * Adds all used users on the Jira server, if they do not exist yet.
     */
    static addUsersToJira() {
        const promises = [];
        for (let user in userMapping) {
            if (userMapping[user].inUse) {
                promises.push(JiraConnector.findUser(userMapping[user]['login'])
                    .catch(function (error) {
                        JiraConnector.createUser(userMapping[user]['firstname'], userMapping[user]['lastname'], userMapping[user]['mail'], userMapping[user]['login']);
                    }))
            }
        }
        return Promise.all(promises).then(function() {
            return Promise.resolve();
        })
    }
}

function getUser(id) {
    if (!id) {
        return null;
    }

    const user = userMapping[id];

    if (!user) {
        console.error(`ERROR: No user found for id ${id}`);
        return null;
    }

    userMapping[id].inUse = true;

    return user;
}