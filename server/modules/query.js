var util = require('util'),
	qs = require('querystring'),
	fs = require('fs'),
	cookie = require('cookie');

var Query = function(req,res){
	this.r = {};
	//req.setEncoding('utf8');
	this.req = req;
	this.res = res;
	this.post = {};
	this.date = new Date;
	this.domain = (req.headers.host || '').toLowerCase().split(':')[0];

	this.ip = req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
	this.ipn = query.ipv4Number(this.ip);

	var Url = require('url').parse(req.url);
	this.path = decodeURI(Url.pathname)
	this.uri = this.path.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');

	//this.get = this.query = Url.query || {};
	this.get = this.query = qs.parse(Url.query) || {},

	this.cookie = cookie.parse(req.headers['cookie'] || '');
	this.lang = this.cookie.lang || cfg.lang;
	this.p = this.uri.split(/[\/]+/);

	if(this.cookie && this.cookie.sid){
		this.sid = this.cookie.sid;
		var ses = acc.sessions[this.cookie.sid];
		if(ses){
			this.session = ses;
			this.user = ses.user;
		}
	}
}

Query.prototype.end = function(j){
	this.res.writeHead(200, {'Content-Type': 'application/json'});
	if(j) _.extend(this.r, j);
	this.res.end(JSON.stringify(this.r));
};



Query.prototype.isSuper = function(){
	return (this.session && this.session.user && this.session.user.super);
};

global.query = {
	tmp: Cfg.path.tmp,
	pathFiles: Cfg.path.files,
	mime: {
		'css': 'text/css',
		'htm': 'text/html',
		'html': 'text/html',
		'js': 'application/javascript',
		'txt': 'text/plain'
	},

	staticDomains: [],

	route: function(p){

	},

	redirect: {},

	serv: function (req, res){
		//res.setHeader('Access-Control-Allow-Origin', '*');
		///res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		//res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

		var q = new Query(req, res);

		q.inf = (req.headers['x-inf'])?JSON.parse(q.req.headers['x-inf']):{};

		res.setHeader('Access-Control-Allow-Origin', '*');
		//console.log(q.req.url);

		var site;


		if(req.method == 'POST'){
			var data = "";
			req.on("data", function(chunk){
				data += chunk;
			});

			req.on("end", function(){
				if(req.headers['content-type'] && req.headers['content-type'].split(';')[0] == 'application/json')
					q.post = (data && (data.substr(-1) == '}' || data.substr(-1) == ']'))?JSON.parse(data):{};
				else
					q.post = data?qs.parse(data):{};


				var path = q.uri,
					fn_path = '';
				for(var i = q.p.length; i; i--){
					var path = q.p.slice(0, i).join('/');


					var fn;
					if(fn = POST_[q.domain])
						fn(q);
					else
					if(fn = POST[path] || (fn = POST['/'+path])){
						if(typeof fn != 'function') return q.end('Error');
						else fn_path = path;

						var e;
						if(cfg.wait)
							setTimeout(function(){
								e = fn(q);
							}, cfg.wait);
						else
							e = fn(q);
						if(e === 0)
							q.end();

						break;
					}
				}

				if(!fn_path){
					log(clc.red('POST: '+path+''));
					q.end({error: 'POST command not found'});
				}
			});
		}
		else if(req.method == 'PUT'){
			if(!q.p[0])
				query.upload(q);
			else
			if(isNaN(q.p[0])){
				if(typeof PUT[q.p[0]] == 'function')
					PUT[q.p[0]](q);
				else q.end({error: 'wrong cmd'});
			} else query.upload(q);
		}
		else if(req.method == 'GET')
			query.onGet(q);
	},

	onGet: function(q){
		var fn;
		if(typeof Sites == 'object' && (site = Sites.domains[q.domain])){
			site.request(q);
		}
		else
		if(q.p[0] && isInt(q.p[0]))
			query.pumpFile(q, q.p[0], q.p[1]);
		else
		if(fn = GET_[q.domain])
			fn(q);
		else
		if(fn = GET[q.uri] || (fn = GET['/'+q.uri]) || (fn = GET[q.p[0]]))
			fn(q);
		else
		if(redirect = query.redirect[q.domain]){
			if(typeof redirect == 'string'){
				log(
					clc.blue.bold(q.ip + "")+' '+
					(q.date.getHours()+':'+q.date.getMinutes())+' '+
					clc.yellow.italic(q.domain) + clc.yellow(q.path) +
					' redirect '+
					clc.yellow.italic(redirect)
				);

				q.res.writeHead(301, {
					Location: 'http://'+redirect+q.path
				});
				q.res.end();
			}
		}
		else
		if(query.staticDomains[q.domain]){
			var sitePath = './static/'+(q.domain).replace(/\/\.+/g,''),
				path = (q.path || '').replace(/\/\.+/g,'');


			var d = query.staticDomains[q.domain];
			if(typeof d == 'object'){
				if(d.path) sitePath = d.path;

				var ext = (path || '').split('.').pop().toLowerCase();
				if(d.staticExts && d.staticExts.indexOf(ext)<0)
					path = '';
			}

			if(!path || path == '/')
				log(
					clc.blue.bold(q.ip + "")+' '+
					(q.date.getHours()+':'+q.date.getMinutes())+' '+
					clc.yellow.italic(q.domain) + clc.yellow(q.path)
				);

			query.pump(q, sitePath+'/'+path);
		}
		else if(global.tree) tree.get(q);
		else
			query.onDomain(q);
	},

	onDomain: function(q){
		log(
			clc.blue.bold(q.req.connection.remoteAddress + "")+' '+
			(q.date.getHours()+':'+q.date.getMinutes())+' '+
			clc.red.italic(q.domain)
		);
		query.pump(q, './static/wrongDomain.html');
	},

	ipv4Number: function (ip){
		iparray = ip.split(".");
		ipnumber = parseInt(iparray[3]) +
		  parseInt(iparray[2]) * 256 +
		  parseInt(iparray[1]) * Math.pow(256, 2) +
		  parseInt(iparray[0]) * Math.pow(256, 3);

		if (parseInt(ipnumber) > 0) return ipnumber;
		return 0;
	},

	pumpFile: function(q, id, mod){
		db.collection(cfg.fs.collection).findOne({id: id}, function (e, file){
			if(!file){
				q.res.writeHead(404);
				q.res.end();
				return;
			}

			if(mod){
				if(mod == 'thumb')
					return query.pump(q, query.pathThumbs + file.id);

				q.res.end();
			}
			else
			if(file.url){
				q.res.writeHead(301, {Location: file.url});
				q.res.end();
			}
			else
			if(file.path)
				query.pump(q, file.path);
			else
				query.pump(q, query.pathFiles + file.id);
		});
	},

	pump: function(q, cf){
		var cfg = {
			download: false
		};

		if(typeof cf == 'string')
			cfg.path = cf;
		else
			_.extend(cfg, cf);

		var path = cfg.path;

		try{
			var stat = fs.lstatSync(path);
			if(stat.isDirectory()){
				path += 'index.html';
				stat = fs.lstatSync(path);
			}
		} catch(e){
			//console.log(path.red);
			q.res.writeHead(404);
			q.res.end();
			return;
		}

		var lm = stat.mtime.toUTCString();
		var renew = !(q.req.headers['if-modified-since'] && q.req.headers['if-modified-since'] == lm);

		var name = path.replace(/^.*[\\\/]/, '');
		var ext = (/(?:\.([^.]+))?$/.exec(name)[1] || '').toLowerCase();

		var headers = {
			'Cache-Control': 'no-cache, must-revalidate',
			'Content-Length': stat.size,
			'Last-Modified': lm,
		};

		if(cfg.download) headers['Content-Type'] = 'application/octet-stream';
		if(cfg.filename) headers['Content-Disposition'] = 'inline; filename="'+cfg.filename+'"';

		var expires = new Date(Date.now() + 2628000000);
		headers.expires = expires.toUTCString();

		if(ext == 'css'){
			headers["Content-Type"] = "text/css";
			headers["X-Content-Type-Options"] = "nosniff";
		}

		if(query.mime[ext])
			headers["Content-Type"] = query.mime[ext];

		q.res.writeHead(renew?200:304,headers);
		if(renew){
			var readStream = fs.createReadStream(path);
			//console.log(readStream);
			readStream.pipe(q.res);
		}
		else
			q.res.end();
	},
};
