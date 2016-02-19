/*
 Created by Vadim on 2/11/16.


 ### Model.paginate([query], [options]

 **Parameters**

 * `[query]` {Object} - Query criteria. [Documentation](https://docs.mongodb.org/manual/tutorial/query-documents)
 * `[options]` {Object}
 - `[select]` {Object | String} - Fields to return (by default returns all fields). [Documentation](http://mongoosejs.com/docs/api.html#query_Query-select)
 - `[sort]` {Object | String} - Sort order. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-sort)
 - `[populate]` {Array | Object | String} - Paths which should be populated with other documents. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-populate)
 - `[lean=false]` {Boolean} - Should return plain javascript objects instead of Mongoose documents?  [Documentation](http://mongoosejs.com/docs/api.html#query_Query-lean)
 - `[leanWithId=true]` {Boolean} - If `lean` and `leanWithId` are `true`, adds `id` field with string representation of `_id` to every document

 - `[page=1]` {Number}
 - `[limit=10]` {Number}

 **Return value**

 Promise fulfilled with object having properties:
 * `docs` {Array} - Array of documents
 * `total` {Number} - Total number of documents in collection that match a query
 * `limit` {Number} - Limit that was used
 * `[page]` {Number} - Only if specified or default `page` values were used
 * `[pages]` {Number} - Only if `page` specified or default `page` values were used

 ### Examples

 #### Skip 20 documents and return 10 documents

 ```js
 Model.paginate({}, { limit: 10 }).then(function(result) {
 // ...
 });
 ```

 #### More advanced example

 ```js
 var query = {};
 var options = {
 select: 'title date author',
 sort: { date: -1 },
 populate: 'author',
 lean: true,
 limit: 10
 };

 Book.paginate(query, options).then(function(result) {
 // ...
 });
 ```

 #### Zero limit

 You can use `limit=0` to get only metadata:

 ```js
 Model.paginate({}, { limit: 0 }).then(function(result) {
 // result.docs - empty array
 // result.total
 // result.limit - 0
 });
 ```

 #### Set custom default options for all queries

 config.js:

 ```js
 var mongoosePaginate = require('mongoose-paginate');

 mongoosePaginate.paginate.options = {
 lean:  true,
 limit: 20
 };
 ```

 controller.js:

 ```js
 Model.paginate().then(function(result) {
 // result.docs - array of plain javascript objects
 // result.limit - 20
 });
 ```
 */

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @returns {Promise}
 */

var Q = require('q');

function paginate(query, options) {

    function toInt(value, defaultValue) {
        var temp;
        try {
            temp = parseInt(value);
            if (isNaN(temp)) {
                throw new Error('empty');
            }
            return temp;
        } catch (e) {
            return defaultValue;
        }
    }

    var $this = this;
    query = query || {};
    options = options || {};
    var select = options.select;
    var sort = options.sort;
    var populate = options.populate;
    var lean = options.lean || false;
    var leanWithId = options.leanWithId ? options.leanWithId : true;
    var maxLimit = options.maxLimit ? options.maxLimit : 100;
    var page, skip, promises;
    options.page = toInt(options.page, 1);
    var limit = toInt(options.limit, 10);
    //security
    limit = Math.min.apply(Math, [limit, maxLimit]);

    if (options.page) {
        page = options.page;
        skip = (page - 1) * limit;
    } else {
        page = 1;
        skip = 0;
    }

    var docsQuery = $this.find(query)
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(lean);
    if (populate) {
        [].concat(populate).forEach(function (item) {
            docsQuery.populate(item);
        });
    }

    return $this.count(query).exec().then(function (count) {
        var result = {};
        result.totalPages = Math.ceil(count / limit) || 1;
        if (page > result.totalPages) {
            page = result.totalPages;
            docsQuery.skip((page - 1) * limit);
        }
        result.totalItems = count;
        return docsQuery.exec().then(function (rows) {
            result.rows = rows;
            result.count = count;
            result.limit = limit;
            result.page = page;
            return Q.resolve(result);
        });
    });
}

/**
 * @param {Schema} schema
 */

module.exports = function (schema) {
    schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;