'use strict';

var Q = require('q');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function getZoneOffset() {
    return -1 * new Date().getTimezoneOffset();
}

module.exports = function (schema, options) {
    schema.add({
        auditing: {
            createdAt: {type: Date, default: Date.now},
            createdBy: {type: Schema.ObjectId, ref: 'KNUser'},
            lastUpdateAt: {type: Date, default: Date.now},
            lastUpdateBy: {type: Schema.ObjectId, ref: 'KNUser'},
            deleted: {type: Boolean, default: false},
            canbedeleted: {type: Boolean, default: true},
            creationZoneOffset: {type: Number, default: getZoneOffset},
            updateZoneOffset: {type: Number, default: getZoneOffset}
        }
    });

    /**
     *  Added index on field // vadim
     */
    schema.index({'auditing.deleted': 1});

    /**
     * Pre-save hook
     */
    schema.pre('save', function (next, params, callback) {
        if (this.auditing.deleted) {
            if (!this.auditing.canbedeleted) {
                return next(new Error('Row can not be deleted'));
            }
        }

        if (this.isNew) {
            this.createdAt = new Date().toISOString();
            if (params) {
                if (params.user && params.user._id) {
                    this.auditing.createdBy = params.user._id;
                }

                if (params.creationZoneOffset) {
                    this.auditing.creationZoneOffset = params.creationZoneOffset;
                }
            }
        }
        if (params) {
            if (params.user && params.user._id) {
                this.auditing.lastUpdateBy = params.user._id;
            }
            if (params.updateZoneOffset || params.creationZoneOffset) {
                this.auditing.updateZoneOffset = params.updateZoneOffset || params.creationZoneOffset;
            }
        }

        this.auditing.lastUpdateAt = new Date().toISOString();
        next(callback);
    });

    schema.methods.delete = function (params) {
        var deferred = Q.defer();
        this.auditing.deleted = true;
        if (!params) {
            params = {};
        }
        this.save(params, function (err, row) {
            if (err) {
                return deferred.reject(err);
            }
            deferred.resolve(row);
        });
        return deferred.promise;
    };
};