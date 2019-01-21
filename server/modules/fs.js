var fs = require('fs-extra');
const Path = require('path');

global.FS = {
	save: function(f, cb){
		var file = {};

		_.extend(file, f);
		file.id = randomString(9);

		file.created = (new Date()).getTime();
		db.collection(cfg.fs.collection).insert(file, {safe: true}, function(e, r){
			if(cb) cb(r.ops[0]);
		});
	},

	type: function(stats){
		if(stats.isDirectory()) return 'directory';
		if(stats.isSymbolicLink()) return 'link';
		if(stats.isSocket()) return 'socket';
		if(stats.isFile()) return 'file';
		if(stats.isFIFO()) return 'fifo';
	},

	locations: {},
}

global.SAVE = FS.locations;

sys.on('loaded', function(){
	sys.sockets2track = [];

	query.upload = function(q){
		var tmpName = randomString(20),
			 tmpPath = query.pathFiles+tmpName,
			 tmpStream = fs.createWriteStream(tmpPath, {flags: 'w'});
		q.req.pipe(tmpStream, {end: false});

		if(q.req.headers.track_id && q.req.headers.track_id){
			q.req.on("data", function(){
				sys.sockets2track[q.req.headers.track_id].send(JSON.stringify({
					_: 'track',
					id: q.req.headers.track_id,
					bytesWritten: tmpStream.bytesWritten,
				}));
			});
		}

		q.req.on("end", function(){
			tmpStream.end();

			if(q.get.track_id)
				delete sys.sockets2track[q.get.track_id];

			/*
			setTimeout(function(){
				if(fs.existsSync(tmpPath)){
					fs.unlink(tmpPath, ecb);
				}
			},60*60*1000);
			*/
			acc.auth(q, function(usr){
				var size = tmpStream.bytesWritten+tmpStream._writableState.length;

				if(q.p[0]){
					var id = parseInt(q.p[0]);
					db.collection(cfg.fs.collection).find({id: id}).toArray(function(err, data){
						if(!data || !data[0]) return q.end({error: 'file not found'});

						var file = data[0];
						if(file.owner && (!usr || usr.id != file.owner)) return q.end({error: 'access denied'});

						if(q.p[1] == 'thumb'){
							fs.renameSync(tmpPath, Thumb.path + file.id);
							q.end({size: size});
							return;
						}

						var set = {
							updated: (new Date()).getTime(),
							size: size
						};

						_.extend(file, set);

						fs.renameSync(tmpPath, file.path || (query.pathFiles + file.id));
						db.collection(cfg.fs.collection).update({id: file.id}, {$set : set}, function(){
							q.end({file: file});
						});
					});

					return;
				}

				var file = {
					id: randomString(9),
					size: size
				};

				if(usr)
					file.owner = usr.id;

				if(q.req.headers['x-name'])
					file.name = q.req.headers['x-name'];

				if(q.req.headers['x-mime'])
					file.mime = q.req.headers['x-mime'];

				file.created = (new Date()).getTime();
				db.collection(cfg.fs.collection).insert(file, {safe: true}, function(e, r){
					fs.renameSync(tmpPath, query.pathFiles + file.id);
					q.end({file: r.ops[0]});
				});
			});
		});
	};
});


GET['fs'] = function(q){
	var path = q.uri.replace(/^\/|\/$/g, '').split('/').slice(1).join('/')

  query.pump(q, {path});
};

S['fs.info'] = function(m, ws, cb){
	//if(!ws.session.user || !ws.session.user.super) return;

	fs.stat(m.path, (err, info) => {
		if(info){
			info.type = FS.type(info);
			cb({info});
		}
		else
			cb({err});
	});
};

S['fs.mkdir'] = function(m, ws, cb){
	fs.ensureDir(m.path, err => {
		cb({err, done: !err});
	});
}

S['fs.list'] = function(m, ws, cb){
	//if(!ws.session.user || !ws.session.user.super) return;

	if(m.mkdirp) fs.ensureDirSync(Path.dirname(m.path));
	fs.readdir(m.path, function(err, list){
		cb({err, list});
	});
};

S['createStream'] = function(m, ws){
	var tmpName = randomString(20),
		tmpPath = query.tmp + tmpName,
		tmpStream = fs.createWriteStream(tmpPath, {flags: 'w'});

	ws.stream = tmpStream;

	if(m.cb)
		RE[m.cb]({name: tmpName});
}

S['saveStream'] = function(m, ws, cb){
	if(!ws.stream) return ws.json({error: 'no stream'});

	ws.stream.end();
	var tmpName = ws.stream.path.split('/').pop();

	var user = ws.session.user;

	if(m.location){
		var save = FS.locations[m.location];

		if(typeof save == 'function')
			save(m, ws);
		return;
	}

	if(m.id){
		C[cfg.fs.collection].find({id: m.id}).toArray(function(err, data){
			if(!data || !data[0]) return ws.json({error: 'file not found'});

			var file = data[0];
			if(file.owner && user && (!user || user.id != file.owner) && !user.super)
				return ws.json({error: 'access denied'});

			var set = {
				updated: (new Date()).getTime(),
				size: ws.stream.bytesWritten
			};

			_.extend(file, set);

			fs.renameSync(ws.stream.path, file.path || (Cfg.path.files + file.id));
			C[cfg.fs.collection].update({id: file.id}, {$set : set}, function(){
				if(m.cb) RE[m.cb]({file: file, name: tmpName});
			});
		});
		return;
	}
	else
	if(m.path){
		fs.ensureDirSync(Path.dirname(m.path));
		fs.renameSync(ws.stream.path, m.path);
		cb({name: tmpName, file: fs.statSync(m.path)});
		return;
	}

	var file = {
		id: randomString(9),
		size: ws.stream.bytesWritten,
		time: (new Date()).getTime()
	};

	if(typeof m.name == 'string')
		file.name = m.name;

	if(typeof m.mime == 'string')
		file.mime = m.mime;

	if(user) file.owner = user.id;

	C[cfg.fs.collection].insert(file, {safe: true}, (e, r) => {
		fs.renameSync(ws.stream.path, Cfg.path.files + file.id);
		delete ws.stream;

		if(m.cb) RE[m.cb]({file: r.ops[0], name: tmpName});
	});
}

S.download = function(m, ws){
	//FS.collection.find({id: m.id}).toArray(function(err, data){
	//	if(!data || !data[0]) return RE[m.cb]({error: 'file not found'});

		var file = m;//data[0];
		var path = file.path || (Cfg.path.files + file.id);

		fs.ensureDirSync(Path.dirname(path));

		var readStream = fs.createReadStream(path);

		readStream.on('data', function(data){
			ws.send(data);
		});

		readStream.on('close', function(err){
			if(m.cb) RE[m.cb]({cmd: 'closeStream', error: err, file});
		});

		readStream.on('error', function(err){
			if(m.cb) RE[m.cb]({error: 'file not exists', file});
		});
	//});
};

S['fs.clone'] = function(m, ws){
	var cb = (say)=>{
		if(!m.cb) return;
		if(typeof say == 'string') RE[m.cb]({error: say});
		else RE[m.cb](say);
	};

	var user = ws.session.user;

	C.tree.findOne({id: m.id}, function(e, item){
		if(e && !item) return cb('wrong id');

		var file = _.pick(m.item, 'name', 'mime', 'size');
		_.extend(file, {
			id: randomString(9),
			time: (new Date()).getTime(),
			created: (new Date()).getTime()
		});
		if(user) file.owner = user.id;


		C[cfg.fs.collection].insert(file, {safe: true}, function(e, r){
			if(e || !r || !r.ops[0]) return cb('error inserting file');
			fs.copySync(item.path || (Cfg.path.files + item.id), Cfg.path.files + file.id);
			cb({file: r.ops[0]});
		});
	});
}

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

S.set = S.get = function(m, ws, cb){
	var user = ws.session.user;

	if(m.path){
		var stats = fs.lstatSync(m.path),
				isDir = stats.isDirectory();

		var file_path = isDir?
			Path.join(m.path, Cfg.fs.folder.item):
			m.path;


		var adapter = new FileSync(file_path);
		var dbl = low(adapter);
	}

	if(m.cmd == 'get'){
		if(m.filter || m.id){
			var filter = _.extend({}, m.filter, {});
			if(m.id) filter.id = m.id;

			var collection = coll.list[m.collection || coll.main];
			if(!collection) return;

			collection.find(filter).toArray(function(err, data){
				if(err || !data || !data[0]) return cb({err});

				var item = data[0];
				//if(!user || !user.super) cleanItem(item);
				cb({item});
			});
		}
		else{
			console.log(dbl);
			var item = m.way?
				dbl.get(m.way).value():
				dbl.getState();

			cb({item});
		}
	}

	if(m.cmd == 'set'){
		dbl.defaults({ children: [], count: 0 });

		if(m.set){
			var keys = Object.keys(m.set);
			keys.forEach(key => dbl.set(key, m.set[key]).write());
		}

		if(m.way && m.value)
			dbl.set(m.way, m.value).write();

		cb({done: 1});
	}
};

S['fs.download'] = function(m, ws, cb){
	if(typeof m.url !== 'string') return cb({error: 'no url'});

	var tmpName = randomString(20),
		tmpPath = Cfg.path.files+tmpName,
		tmpStream = fs.createWriteStream(tmpPath, {flags: 'w'});

	var mod = require(m.url.indexOf('https:')==0?'https':'http');
	var request = mod.get(m.url, function(response){
		response.pipe(tmpStream);
		tmpStream.on('finish', function() {
			tmpStream.close(function(){
				var file = {
					id: randomString(9)
				};

				var user = ws.session.user;
				if(user) file.owner = user.id;
				if(m.name) file.name = m.name;
				file.created = (new Date()).getTime();

				// to save as file
				if(m.path){
					fs.renameSync(tmpPath, m.path);
					cb({done: 1});
				}
				else
				db.collection(cfg.fs.collection).insert(file, {safe: true}, function(e, r){
					if(!r.ops[0]) return;
					fs.renameSync(tmpPath, Cfg.path.files + file.id);
					RE[m.cb]({file: r.ops[0]});
				});
			});
		});
	});
};

POST.fs = function(q){
	switch(q.p[1]){
		case 'list':
			var path = './static/'+(q.domain+'/').replace(/\/\.+/g,'') + (q.post.path || '');
			fs.readdir(path, function(err, files){
				q.end({list: files});
			});
			break;

		case 'add':
			if(typeof q.post.url !== 'string') return q.end({error: 'no url'});

			var file = {
				id: randomString(9)
			};
			if(q.user) file.owner = q.user.id;
			file.created = (new Date()).getTime();
			file.url = q.post.url;

			db.collection(cfg.fs.collection).insert(file, {safe: true}, function(e, doc){
				q.end({file: doc[0]});
			});
			break;

		case 'download':
			if(typeof q.post.url !== 'string') return q.end({error: 'no url'});

			var tmpName = randomString(20),
				tmpPath = query.pathFiles+tmpName,
				tmpStream = fs.createWriteStream(tmpPath, {flags: 'w'});

			var request = require('http').get(q.post.url, function(response){
				response.pipe(tmpStream);
				tmpStream.on('finish', function() {
					tmpStream.close(function(){
						var file = {
							id: randomString(9)
						};
						if(q.user) file.owner = q.user.id;
						file.created = (new Date()).getTime();

						db.collection(cfg.fs.collection).insert(file, {safe: true}, function(e, doc){
							fs.renameSync(tmpPath, query.pathFiles + file.id);
							q.end({file: doc[0]});
						});
					});
				});
			});
			break;
	};
};

SOCK.sys = function(ws){
	ws.on('message', function(msg){
		if(typeof msg == 'string'){
			var m = JSON.parse(msg);

			if(m._ == 'track')
				sys.sockets2track[m.id] = ws;
		}
	});
};
