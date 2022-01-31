/**
 * Types for Jira custom fields
 */
'use strict';

import Settings from '../settings';
import JiraHistory from './jiraHistory';
import Mappings from '../mappings/mappings';
import UserMappings from "../mappings/userMappings";

/**
 * The regex pattern to search for references of issues in texts
 * @type {RegExp}
 */
const REDMINE_REFERENCE_PATTERN = new RegExp(/(?:CR)?#(\d+)/, 'gi');

/**
 * Regex pattern for escaped unicode characters
 * @type {RegExp}
 */
const UNICODE_ESCAPED_CHARACTER_PATTERN = new RegExp(/\u0000/, 'gi');

/**
 * Regex pattern for <pre>...</pre> code tags
 * @type {RegExp}
 */
const CODE_TAG_PATTERN = new RegExp(/<\/?pre>/, 'gi');

/**
 * The Prefix for textual issue references in Jira
 * @type {string}
 */
const JIRA_PREFIX = Settings.getJiraProjectKey();

/**
 * Links between Jira issues.
 * @type {Array.<Object>}
 */
const issueLinks = [];

export default class JiraIssue {
    /**
     * Constructor
     * Creates a issue for jira from a given redmine issue.
     *
     * @param redmineIssue {Object} The redmine issue object from the redmine server
     */
    constructor(redmineIssue) {
        this.key = `${JIRA_PREFIX}-${redmineIssue['id']}`;
        this.reporter = UserMappings.mapUserToLogin(redmineIssue['author']['id']);
        this.issueType = redmineIssue['tracker']['name'];
        this.summary = JiraIssue.correctText(redmineIssue['subject']);
        this.description = JiraIssue.correctText(redmineIssue['description']);
        this.created = redmineIssue['created_on'];
        this.updated = redmineIssue['updated_on'];
        if (redmineIssue['category']) {
            this.components = [redmineIssue['category']['name']];
        }
        if (redmineIssue['fixed_version']) {
            this.fixedVersions = [redmineIssue['fixed_version']['name']];
        }
        this.status = Mappings.mapState(redmineIssue.status.id);
        this.priority = redmineIssue['priority']['name'];
        if (redmineIssue['assigned_to']) {
            this.assignee = UserMappings.mapUserToLogin(redmineIssue['assigned_to']['id'])
        }
        this.customFieldValues = createCustomFieldValues(redmineIssue['custom_fields']);
        this.attachments = createAttachments(redmineIssue['attachments']);
        this.comments = extractComments(redmineIssue['journals']);
        this.history = JiraHistory.createHistory(redmineIssue['journals']);
        this.labels = JiraHistory.extractLabels(redmineIssue['tags']);
        extractLinks(redmineIssue['relations'], redmineIssue['id']);
    }

    static getLinks() {
        return issueLinks;
    }

    /**
     * Replaces all references to other issues in the text and removes invalid characters
     */
    static correctText(text) {
        let correctedText = text.replace(REDMINE_REFERENCE_PATTERN, `${JIRA_PREFIX}-$1`);
        correctedText = correctedText.replace(UNICODE_ESCAPED_CHARACTER_PATTERN, '');
        correctedText = correctedText.replace(CODE_TAG_PATTERN, '{code}');

        return correctedText;
    }
}


function extractLinks(relations, id) {
    if (!relations) {
        return;
    }

    for (let i = 0; i < relations.length; i++) {
        if (relations[i]['issue_id'] === id) {
            const name = Mappings.LINK_TYPES[relations[i]['relation_type']];
            if (!name) {
                console.warn(`Can not map relation type ${relations[i]['relation_type']}`);
                continue;
            }
            issueLinks.push({
                name: name,
                sourceId: `${JIRA_PREFIX}-${relations[i]['issue_id']}`,
                destinationId: `${JIRA_PREFIX}-${relations[i]['issue_to_id']}`
            });
        }
    }
}

/**
 * Returns the comments from the given Redmine issue journal
 * @param redmineJournal
 */
function extractComments(redmineJournal) {
    const comments = [];

    for (let i = 0; i < redmineJournal.length; i++) {
        if (redmineJournal[i]['notes']) {
            comments.push({
                body: JiraIssue.correctText(redmineJournal[i]['notes']),
                author: UserMappings.mapUserToLogin(redmineJournal[i]['user']['id']),
                created: redmineJournal[i]['created_on']
            });
        }
    }

    return comments;
}

/**
 * Creates the custom fields for this Jira issue from the given Redmine custom fields.
 *
 * @param {Array.<Object>} redmineCustomFields
 */
function createCustomFieldValues(redmineCustomFields) {
    const jiraCustomFields = [];

    console.log(redmineCustomFields);

    if (redmineCustomFields) {
        for (let i = 0; i < redmineCustomFields.length; i++) {
            const redmineCustomField = redmineCustomFields[i];
            if (redmineCustomField['value'] !== '') {
                const name = redmineCustomField['name'];
                const type = Mappings.CUSTOM_FIELD_TYPES[name];

                if (!type) {
                    throw Error(`Could not map custom field type ${type}`);
                }

                jiraCustomFields.push({
                    'fieldName': name,
                    'fieldType': type,
                    'value': type.endsWith('userpicker') ? UserMappings.mapUserToLogin(redmineCustomField['value']) : redmineCustomField['value']
                });
            }
        }
    }

    return jiraCustomFields;
}

/**
 * Creates the attachments for this Jira issue from the given Redmine attachments
 *
 * @param {Array.<Object>} redmineAttachments
 */
function createAttachments(redmineAttachments) {
    const attachments = [];

    for (let i = 0; i < redmineAttachments.length; i++) {
        const redmineAttachment = redmineAttachments[i];

        attachments.push({
            'name': redmineAttachment['filename'],
            'attacher': UserMappings.mapUserToLogin(redmineAttachment['author']['id']),
            'created': redmineAttachment['created_on'],
            'uri': translateAttachmentUrl(redmineAttachment['content_url']),
            'description': redmineAttachment['description']
        });
    }

    return attachments;
}

/**
 * Translates the given url of an attachment to be valid for Jira
 */
function translateAttachmentUrl(url) {
    return url.replace(new RegExp(Settings.getRedmineHost(), 'g'), Settings.getAttachmentServerAddress());
}