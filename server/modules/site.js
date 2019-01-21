var cheerio = require('cheerio');

global.Sites = {
	domains: {},

	checkBot: function(agent){
		return !(
			agent.search(/spider/i)<0 &&
			agent.search(/bot/i)<0 &&
			agent.search(/yahoo/i)<0 &&
			agent.search(/facebook/i)<0 &&
			agent.search(/snippet/i)<0
		)
	}
};

global.Site = function(cfg){
	var site = this;

	_.extend(site, {
		documents: {},
		staticExts: [
			'js', 'css', 'png', 'gif', 'ico', 'jpg', 'htm', 'map', 'html', 'xml', 'txt',
			'woff', 'woff2', 'ttf', 'svg', 'mp3'
		],
		loaders: {},
		index: 'index.html',
		domains: [],
		seo: false
	}, cfg);

	site.domains.some(function(domain){
		Sites.domains[domain] = site;
	});
}

_.extend(Site.prototype, {
	load: function(name, as){
		var t = this,
			file = t.path+"/"+name,
			reload = function(){
				var content = fs.readFileSync(file, "utf-8");
				t.documents[(as || name)] = content;
			};

		reload();
		fs.watchFile(file, function(){
			reload();
			console.log('Reload: '+clc.yellow(file));
		});;
	},

	request: function(q){
		var path = ((q.path || '').replace(/\/\.+/g,'').replace(/^\/|\/$/g, ''));
		console.log(path);

		var doc;

		if(!this.seo){
			q.filePath = this.path+'/'+path;

			var ext = (path || '').split('.').pop().toLowerCase();
			//console.log(ext);
			if(this.staticExts && this.staticExts.indexOf(ext)+1){
				//console.log(this.config.path+path);
				query.pump(q, q.filePath);
				return;
			}

			doc = this.documents[path];
		}

		if(!doc)
			doc = this.documents[this.index];

		log(
			clc.blue.bold(q.req.connection.remoteAddress + "")+' '+
			(q.date.getHours()+':'+q.date.getMinutes())+' '+
			clc.yellow.italic(q.domain) + clc.yellow(q.path)
		);

		if(typeof this.onRequest == 'function')
			this.onRequest(q, doc);
		else
			this.send(q.doc);
	},

	send: function(q, cont){
		var headers = {
			'Cache-Control': 'no-cache, must-revalidate',
			'Content-Type': 'text/html'
		};

		q.res.writeHead(200, headers);
		q.res.end(cont);
	}
});
