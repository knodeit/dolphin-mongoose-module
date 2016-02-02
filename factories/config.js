/**
 * Created by Vadim on 12/9/15.
 */
'use strict';
var Q = require('q');
var _ = require('lodash');
var modules = [];
var startEvent = Q.defer();
var endEvent = Q.defer();

module.exports = {
    name: 'Configuration',
    entity: {
        events: {
            _startEvent: startEvent,
            _endEvent: endEvent,
            start: startEvent.promise,
            end: endEvent.promise
        },
        debug: false,
        database: null,
        defaultPlugins: [__dirname + '/../auditing.js'],
        plugins: [],
        db: 'mongodb://localhost/dolphin',
        dbOptions: {},
        addModule: function (module) {
            modules.push(module);
        },
        getModules: function () {
            return _.uniq(modules);
        }
    }
};