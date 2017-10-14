'use strict';

import JiraConnector from '../connectors/jira';
import RedmineConnector from '../connectors/redmine';

/**
 * Mapping from Redmine user id to Redmine user object.
 *
 * @type {Object}
 */
const userMapping = {
    363: {
        'id': 363,
        'login': 'anonymous',
        'firstname': 'Anonymous',
        'lastname': '',
        'mail': 'anonymous@mail.com',
        'created_on': '2012-01-01T00:00:00Z',
        'api_key': 'abcdefghijklmnopqrstuvwxyz1234567890',
        'status': 0
    }
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