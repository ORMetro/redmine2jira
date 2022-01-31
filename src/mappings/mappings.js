/**
 * User Mapping from Redmine (id) to Jira (login)
 */
'use strict';

import RedmineConnector from '../connectors/redmine';
import Settings from '../settings';
import UserMappings from "./userMappings";

/**
 * Mapping from id to string for versions
 */
const versionMapping = {
    '925': 'Backlog',
    '1103': 'Backlog'
};

/**
 * Mapping from id to string for states
 */
const statusMapping = {
    '1': 'To do',
    '2': 'In progress',
    '3': 'Needs review',
    '4': 'Done',
    '5': 'Done',
    '6': 'Done',
    '7': 'Done',
    '9': 'Needs review',
    '10': 'Needs review',
    '11': 'Tp dp',
    '12': 'In progress',
    '13': 'Done',
    '14': 'Done',
};

/**
 * Mapping from id to string for issue types
 */
const issueTypeMapping = {};

/**
 * Mapping from id to string for custom fields
 */
const customFieldMapping = {};

/**
 * Mapping from id to string for issue priorities
 */
const priorityMapping = {
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
    'Urgent': 'Highest',
    'Hair on fire': 'Highest'
};

/**
 * Mappings from id to string for components
 */
const componentMapping = {};

export default class FieldMappings {
    /**
     * Custom field types.
     * See https://confluence.atlassian.com/adminjiraserver071/importing-data-from-json-802592907.html#ImportingdatafromJSON-CustomFields
     */
    static CUSTOM_FIELD_TYPES = {
        'QA-Contact': 'com.atlassian.jira.plugin.system.customfieldtypes:userpicker',
        'PDash Task': 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
        'Freshdesk URL': 'com.atlassian.jira.plugin.system.customfieldtypes:url',
        'Customer': 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
        'Affected Version': 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
        'Customer Issue': 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
        'Merge Request': 'com.atlassian.jira.plugin.system.customfieldtypes:url',
        'Patch Version': 'com.atlassian.jira.plugin.system.customfieldtypes:textfield'
    };

    static ATTR_FIELDS = {
        'subject': 'summary',
        'description': 'description',
        'status_id': 'status',
        'assigned_to_id': 'assignee',
        'priority_id': 'priority',
        'fixed_version_id': 'fixVersions',
        'tracker_id': 'issueType',
        'parent_id': 'link',
        'tags': 'labels',
        'category_id': 'components',
        'done_ratio': 'done_ratio',
        'project_id': 'project_id',
        'start_date': 'start_date',
        'due_date': 'due_date',
        'estimated_hours': 'estimated_hours',
        'sprint_id': 'sprint_id'
    };

    /**
     * Only one way: from this issue to another
     */
    static LINK_TYPES_ONE_WAY = {
        'relates': 'relates to',
        'blocks': 'blocks',
        'duplicates': 'duplicates',
        'precedes': 'precedes',
        'copied_to': 'clones'
    };

    static LINK_TYPES = {
        'relates': 'Relates',
        'blocks': 'Blocks',
        'duplicates': 'Duplicate',
        'precedes': 'Predecessor',
        'copied_to': 'Cloners'};

    /**
     * Generates mappings for lookups.
     * @param redmineIssues
     */
    static generateMappings(redmineIssues) {
        console.info('Generating mappings');

        const promises = [
            UserMappings.generateUserMapping(),
            generateMap(versionMapping, RedmineConnector.getVersions()),
            // generateMap(statusMapping, RedmineConnector.getIssueStates()),
            generateMap(issueTypeMapping, RedmineConnector.getTrackerTypes()),
            generateMap(customFieldMapping, RedmineConnector.getCustomFields()),
            generateMap(priorityMapping, RedmineConnector.getPriorities()),
            generateMap(componentMapping, RedmineConnector.getCategories()),
        ];

        return Promise.all(promises)
            .then(function () {
                return Promise.resolve(redmineIssues);
            });
    }

    static mapVersion = id => mapValue(versionMapping, id, 'version');
    static mapState = id => mapValue(statusMapping, id, 'status');
    static mapIssueType = id => mapValue(issueTypeMapping, id, 'tracker');
    static mapCustomField = id => mapValue(customFieldMapping, id, 'custom field');
    static mapPriority = id => mapValue(priorityMapping, id, 'priority');
    static mapCategory = id => mapValue(componentMapping, id, 'category');

    /**
     * Generates a string representation of the given relation
     */
    static generateLinkString(linkDetail, relationString) {
        if (!linkDetail) {
            return null;
        }

        return `This issue ${relationString} ${Settings.getJiraProjectKey()}-${linkDetail}`;
    }
}

/**
 * Generates a mapping.
 *
 * @param {Object} mapping Used to store the mapping
 * @param {Promise} promise The promise containing the entities
 */
function generateMap(mapping, promise) {
    return promise.then(function (entities) {
        for (let i = 0; i < entities.length; i++) {
            mapping[entities[i]['id']] = entities[i]['name'];
        }

        return Promise.resolve();
    });
}

/**
 * Maps the given id to a string using the given map. Logs, if there is no match
 *
 * @return {?string} the mapped value or null, if input id is null or empty string
 */
function mapValue(map, id, name) {
    if (!id) {
        return null;
    }

    const value = map[id];
    if (!value) {
        console.warn(`No ${name} for id ${id} found`);
    }
    return value;
}

