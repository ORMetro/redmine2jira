'use strict';

import Express from 'express';
import Request from 'request-promise-native';
import Settings from './settings';


/**
 * Url of the Redmine server
 * @type {string}
 */
const BASE_URL = Settings.getRedmineHost();

const PORT = process.env.PORT || 3001;

/**
 * The basic authorization header
 */
const AUTHORIZATION_HEADER = new Buffer('username:password').toString('base64');

const app = Express();

app.get(/attachments\/download\/.*/, function (req, res) {
    console.log(`${req.method} ${req.url}`);

    const headers = req.headers;
    headers['host'] = Settings.getRedmineHost().replace(/^https?:\/\//, '').replace(/:\d+/, '').replace(/\/.*/, '');
    headers['X-Redmine-API-Key'] = Settings.getRedmineApiKey();
    headers['Authorization'] = `Basic ${AUTHORIZATION_HEADER}`;

    Request({
        uri: BASE_URL + req.url,
        headers: headers,
        resolveWithFullResponse: true,
        encoding: null
    })
        .then(function (response) {
            console.log(`${response.statusCode}: ${response.body.length} Bytes`);
            res.header({
                'content-type': response.headers['content-type'],
                'content-length': response.headers['content-length']
            });
            res.send(response.body);
        })
        .catch(function (error) {
            console.log(error);
            res.status(404);
            res.send('File not found');
        });
});

app.listen(PORT);

console.log(`Attachment Server running on ${PORT}`);