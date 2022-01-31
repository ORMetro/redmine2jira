'use strict';

import Mappings from '../mappings/mappings';
import UserMappings from "../mappings/userMappings";
import JiraIssue from "./jiraIssue";

export default class JiraHistory {
    /**
     * Creates the Jira history for the given redmine journals
     *
     * @param {Array.<Object>} redmineJournal
     */
    static createHistory(redmineJournal) {
        const changes = [];

        for (let i = 0; i < redmineJournal.length; i++) {
            const entry = {
                author: UserMappings.mapUserToLogin(redmineJournal[i]['user']['id']),
                created: redmineJournal[i]['created_on'],
                items: []
            };

            for (let j = 0; j < redmineJournal[i]['details'].length; j++) {
                const detail = redmineJournal[i]['details'][j];
                switch (detail['property']) {
                    case 'cf':
                        entry.items.push(getCustomFieldChange(detail));
                        break;
                    case 'attr':
                        entry.items.push(getAttributeChange(detail));
                        break;
                    case 'relation':
                        entry.items.push(getRelationChange(detail));
                        break;
                    case 'attachment':
                        entry.items.push(getAttachmentChange(detail));
                        break;
                    default:
                        console.error(`Invalid property type: ${detail['property']}`);
                }
            }

            entry.items = entry.items.filter(item => !!item); // filter empty items
            if (entry.items.length !== 0) {
                changes.push(entry);
            }
        }

        return changes;
    }


    /**
     * Extracts labels for Jira from the given Redmine tags
     */
    static extractLabels(redmineTags) {
        const labels = [];
        if (redmineTags) {
            for (let i = 0; i < redmineTags.length; i++) {
                labels.push(redmineTags[i]['id']);
            }
        }
        return labels;
    }
}

function getCustomFieldChange(detail) {
    const historyEntry = {
        field: Mappings.mapCustomField(detail['name']),
        fieldType: 'custom'
    };

    switch (historyEntry.field) {
        case 'QA-Contact':
            historyEntry.from = UserMappings.mapUserToLogin(detail['old_value']);
            historyEntry.to = UserMappings.mapUserToLogin(detail['new_value']);
            historyEntry.fromString = UserMappings.mapUserToName(detail['old_value']);
            historyEntry.toString = UserMappings.mapUserToName(detail['new_value']);
            break;
        case 'Patch Version':
            historyEntry.fromString = Mappings.mapVersion(detail['old_value']);
            historyEntry.toString = Mappings.mapVersion(detail['new_value']);
            break;
        case 'Merge Request':
        case 'Customer':
        case 'Affected Version':
        case 'Customer Issue':
        case 'PDash Task':
        case 'Freshdesk URL':
            historyEntry.fromString = detail['old_value'];
            historyEntry.toString = detail['new_value'];
            break;
        case undefined: // Custom field deleted in Redmine and not accessible anymore
            return null;
        default:
            console.error(`Could not translate cf change: No match for field name ${historyEntry.field}`);
    }

    return historyEntry;
}

function getAttributeChange(detail) {
    const historyEntry = {
        field: Mappings.ATTR_FIELDS[detail['name']]
    };

    switch (historyEntry.field) {
        case 'status':
            historyEntry.fromString = Mappings.mapState(detail['old_value']);
            historyEntry.toString = Mappings.mapState(detail['new_value']);
            break;
        case 'fixVersions':
            historyEntry.fromString = Mappings.mapVersion(detail['old_value']);
            historyEntry.toString = Mappings.mapVersion(detail['new_value']);
            break;
        case 'priority':
            historyEntry.fromString = Mappings.mapPriority(detail['old_value']);
            historyEntry.toString = Mappings.mapPriority(detail['new_value']);
            break;
        case 'assignee':
            historyEntry.from = UserMappings.mapUserToLogin(detail['old_value']);
            historyEntry.to = UserMappings.mapUserToLogin(detail['new_value']);
            historyEntry.fromString = UserMappings.mapUserToName(detail['old_value']);
            historyEntry.toString = UserMappings.mapUserToName(detail['new_value']);
            break;
        case 'issueType':
            historyEntry.fromString = Mappings.mapIssueType(detail['old_value']);
            historyEntry.toString = Mappings.mapIssueType(detail['new_value']);
            break;
        case 'link':
            historyEntry.fromString = Mappings.generateLinkString(detail['old_value'], 'is parent of');
            historyEntry.toString = Mappings.generateLinkString(detail['new_value'], 'is parent of');
            break;
        case 'components':
            historyEntry.fromString = Mappings.mapCategory(detail['old_value']);
            historyEntry.toString = Mappings.mapCategory(detail['new_value']);
            break;
        case 'done_ratio':
        case 'project_id':
        case 'start_date':
        case 'due_date':
        case 'estimated_hours':
        case 'sprint_id':
            return null; // Fields not important
        case 'description':
            historyEntry.fromString = JiraIssue.correctText(detail['old_value']);
            historyEntry.toString = JiraIssue.correctText(detail['new_value']);
            if (historyEntry.fromString.startsWith('?PNG') || historyEntry.toString.startsWith('?PNG')) {
                return null; // history has invalid content (bug in redmine?)
            }
            break;
        case 'summary':
            historyEntry.fromString = JiraIssue.correctText(detail['old_value']);
            historyEntry.toString = JiraIssue.correctText(detail['new_value']);
            break;
        case 'labels':
            historyEntry.fromString = detail['old_value'];
            historyEntry.toString = detail['new_value'];
            break;
        default:
            console.error(`Could not translate attr change: No match for field name ${historyEntry.field}`);
    }

    if (!historyEntry.fromString && !historyEntry.toString) {
        return null; // Values have been deleted e.g. specific version is deleted
    }

    return historyEntry;
}

function getRelationChange(detail) {
    return {
        field: 'link',
        fromString: Mappings.generateLinkString(detail['old_value'], Mappings.LINK_TYPES_ONE_WAY[detail['name']]),
        toString: Mappings.generateLinkString(detail['new_value'], Mappings.LINK_TYPES_ONE_WAY[detail['name']])
    };
}

function getAttachmentChange(detail) {
    return {
        field: 'Attachment',
        fromString: detail['old_value'],
        toString: detail['new_value']
    };
}