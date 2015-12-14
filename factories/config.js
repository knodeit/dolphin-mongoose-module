/**
 * Created by Vadim on 12/9/15.
 */
'use strict';
var modules = [];

module.exports = {
    name: 'Configuration',
    entity: {
        debug: false,
        database: null,
        plugins: [],
        db: 'mongodb://localhost/dolphin',
        dbOptions: {},
        addModule: function (module) {
            modules.push(module);
        },
        getModules: function () {
            return modules;
        }
    }
};