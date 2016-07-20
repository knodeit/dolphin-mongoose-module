/**
 * Created by Vadim on 12/3/15.
 */
'use strict';
var mongoose = require('mongoose');
var Q = require('q');
var PathUtil = require('path');
var FSUtil = require('dolphin-core-utils').FS;
var Module = require('dolphin-core-modules').Module;
var Logger = require('dolphin-logger');

var deferred = Q.defer();
var plugins = [];
var m = new Module('Mongoose', __dirname);
var SERVER_FOLDER = 'server';
var MODELS_FOLDER = 'models';
var PLUGINS_FOLDER = 'models_ext';

m.getModel = function (name) {
    return mongoose.model(name);
};

function loadModels(module) {
    var deferred = Q.defer();
    FSUtil.readDir(module.resolvePath(PathUtil.join(SERVER_FOLDER, MODELS_FOLDER, '/**/*.js'))).then(function (files) {
        for (var i in files) {
            try {
                require(files[i]);
            } catch (err) {
                Logger.error('Require models error:', err);
            }
        }
        deferred.resolve();
    });
    return deferred.promise;
}

function loadPlugins(module) {
    var deferred = Q.defer();
    FSUtil.readDir(module.resolvePath(PathUtil.join(SERVER_FOLDER, PLUGINS_FOLDER, '/**/*.js'))).then(function (files) {
        for (var i in files) {
            try {
                var obj = require(files[i])();
                if (obj.model) {
                    plugins.push(obj);
                }
            } catch (err) {
                Logger.error('Require plugins error:', err);
            }
        }
        deferred.resolve();
    });
    return deferred.promise;
}

m.configureFactories(function (WebServerConfigurationFactory) {
    WebServerConfigurationFactory.addPromise(deferred.promise);
});

m.run(function (MongooseConfigurationFactory) {
    //event start
    MongooseConfigurationFactory.events._startEvent.resolve();

    mongoose.set('debug', MongooseConfigurationFactory.debug);
    MongooseConfigurationFactory.database = mongoose.connect(MongooseConfigurationFactory.db, {server: {reconnectTries: Number.MAX_VALUE}});

    mongoose.connection.on('open', function (e) {
        Logger.info('Mongoose connection open to:', MongooseConfigurationFactory.db);

        //register default plugins
        MongooseConfigurationFactory.defaultPlugins.forEach(function (file) {
            mongoose.plugin(require(file));
        });

        //load models
        var funcs = [];
        var modules = MongooseConfigurationFactory.getModules();
        for (var i in modules) {
            funcs.push(loadModels(modules[i]));
            funcs.push(loadPlugins(modules[i]));
        }

        Q.all(funcs).then(function () {
            //apply global plugins
            MongooseConfigurationFactory.plugins.forEach(function (file) {
                mongoose.plugin(require(file));
            });

            //apply dynamic plugins
            plugins.forEach(function (obj) {
                if (!MongooseConfigurationFactory.database.modelSchemas[obj.model]) {
                    return Logger.warn('Model', obj.model, 'do not exists for the extension');
                }

                delete mongoose.connection.models[obj.model];
                mongoose.model(obj.model, MongooseConfigurationFactory.database.modelSchemas[obj.model].plugin(obj.plugin));
            });

            //for web server
            deferred.resolve();

            //event end, notify all modules
            setTimeout(function () {
                MongooseConfigurationFactory.events._endEvent.resolve();
            }, 0);
        });
    });

    // If the connection throws an error
    mongoose.connection.on('error', function (err) {
        Logger.error('Mongoose default connection error: ' + err);
    });
});