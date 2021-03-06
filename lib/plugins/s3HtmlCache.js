var cache_manager = require('cache-manager');
var s3 = new (require('aws-sdk')).S3({params:{Bucket: process.env.S3_BUCKET_NAME}});

module.exports = {
    sendBeforeSave: true,

    init: function(server) {
        this.server = server
        this.cache = cache_manager.caching({
            store: s3_cache
        });
    },

    beforePhantomRequest: function(req, res, next) {
        if(req.method !== 'GET') {
            return next();
        }

        _this = this;
        this.cache.store.head(req.prerender.url, function (err, result) {
            if(err) console.error(err);

            if (!err && result) {
                date_created = new Date(result['LastModified']);
                date_now = new Date();
                diff = (date_now - date_created) / 1000 / 60 / 60;

                if (diff > 24) {
                    next();
                } else {
                    _this.cache.get(req.prerender.url, function (err, result) {
                        if(err) console.error(err);

                        if (!err && result) {
                            console.log('cache hit');
                            return res.send(200, result.Body);
                        }
                        
                        next();
                    });        
                }    
            } else {
                next();
            }
            
        });
    },

    afterPhantomRequest: function(req, res, next) {
        var _this = this;
        this.server._pluginEvent("beforeSave", [req, res], function() {
            _this.cache.set(req.prerender.url, req.prerender.documentHTML, function(err, result) {
                if (err) console.error(err);
            });
            next();
        });
        
    }
};


var s3_cache = {
    head: function(key, callback) {
        if (process.env.S3_PREFIX_KEY) {
            key = process.env.S3_PREFIX_KEY + '/' + key;
        }
        key = key.replace(/https?:\/\//, "");

        s3.headObject({
            Key: key
        }, callback);
    },
    get: function(key, callback) {
        if (process.env.S3_PREFIX_KEY) {
            key = process.env.S3_PREFIX_KEY + '/' + key;
        }
        key = key.replace(/https?:\/\//, "");

        s3.getObject({
            Key: key
        }, callback);
    },
    set: function(key, value, callback) {
        if (process.env.S3_PREFIX_KEY) {
            key = process.env.S3_PREFIX_KEY + '/' + key;
        }
        key = key.replace(/https?:\/\//, "");

        var request = s3.putObject({
            Key: key,
            ContentType: 'text/html;charset=UTF-8',
            StorageClass: 'REDUCED_REDUNDANCY',
            Body: value
        }, callback);

        if (!callback) {
            request.send();
        }
    }
};
