var cache_manager = require('cache-manager');

module.exports = {
    sendBeforeSave: true,

    init: function(server) {
        this.server = server
        this.cache = cache_manager.caching({
            store: 'memory', max: process.env.CACHE_MAXSIZE || 100, ttl: process.env.CACHE_TTL || 60/*seconds*/
        });
    },

    beforePhantomRequest: function(req, res, next) {
        this.cache.get(req.prerender.url, function (err, result) {
            if (!err && result) {
                res.send(200, result);
            } else {
                next();
            }
        });
    },

    afterPhantomRequest: function(req, res, next) {
        var _this = this;
        this.server._pluginEvent("beforeSave", [req, res], function() {
            _this.cache.set(req.prerender.url, req.prerender.documentHTML);
            next();
        });
        
    }
}
