module.exports = {
    init: function (server) {  
      this.server = server;

      exists = false;
      for (var k in server.plugins) {
        plugin = server.plugins[k];
        if (plugin.hasOwnProperty("sendBeforeSave")) {
          exists = true;
        }
      }

      if (!exists) {
        console.log("This plugin will not behave correctly since there is nobody sending beforeSave (look into s3HtmlCache)");  
      }
    },
    beforeSave: function(req, res, next) {
      	if(!req.prerender.documentHTML) {
      		  return next();
      	}

        var matches = req.prerender.documentHTML.toString().match(/<script(?:.*?)>(?:[\S\s]*?)<\/script>/gi);
        for (var i = 0; matches && i < matches.length; i++) {
            if(matches[i].indexOf('application/ld+json') === -1) {
                req.prerender.documentHTML = req.prerender.documentHTML.toString().replace(matches[i], '');
            }
        }

        next();
    }
};
