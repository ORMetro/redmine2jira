'use strict';

import PropertiesReader from 'properties-reader';
import Prompt from 'prompt-sync';

const prompt = Prompt();
const properties = PropertiesReader('settings.ini');

let password = null;

/**
 * Read settings from the settings.ini
 */
export default class Settings {
    static getRedmineHost() {
        return properties.get('redmineServerUrl');
    }

    static getRedmineApiKey() {
        return properties.get('apiKey');
    }

    static getRedmineProject() {
        return properties.get('redmineProject');
    }

    static getAttachmentServerAddress() {
        return properties.get('attachmentServerAddress');
    }

    static getJiraHost() {
        return properties.get('jiraServerUrl');
    }

    static getJiraUser() {
        return properties.get('jiraUser');
    }

    static getJiraPassword() {
        if (!password) {
            password = properties.get('jiraPassword');
            if (!password) {
                try {
                    password = prompt.hide(`Password for user ${this.getJiraUser()}: `);
                    if (!password) {
                        console.error('No password provided');
                        process.exit(-1);
                    }
                } catch (error) {
                    console.error('Can not request password from this terminal');
                    process.exit(-1);
                }
            }
        }

        return password;
    }

    static getJiraProject() {
        return properties.get('jiraProject');
    }

    static getJiraProjectKey() {
        return properties.get('jiraProjectKey');
    }
}