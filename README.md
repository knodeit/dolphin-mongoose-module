### Installation
```npm install dolphin-mongoose-package --save```


### MongooseConfigurationFactory

The factory has default properties and methods:
* events (start, end) work via promises
* debug - true or false
* database - the link of current DB
* plugins - filepath of plugins
* db - host to mongoDB
* dbOptions - for tuning

methods:
* addModule - registration custom module


When you call "addModule" the plugin will read all models and extensions:
```
package_folder
   server
      models - mongoose models
      models_ext
```

A model extension must be the following code:
```
module.exports = function () {
    return {
        model: 'User', // name of model which need to extend
        plugin: function (schema, options) {

        }
    };
};
```
