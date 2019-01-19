var crypto = require('crypto');
var qs = require('querystring');
var whiskers = require('whiskers');

global.acc = global.Acc = {
	db: db.collection('acc'),
	avPath: cfg.files + 'avatars/',
	bgPath: cfg.files + 'backgrounds/',
	admins: [1],

	captchas: {},

	tpl: {},
	template: function(name){
		if(!Acc.tpl[name]){
			var data = fs.readFileSync(cfg.templates_path + name+'.html', 'utf8');
			Acc.tpl[name] = whiskers.compile(data);
		}

		return Acc.tpl[name];
	},

	onChange: {},

	usr: function(a, cb_ok, cb_err){
		if(!a){
			cb_err();
			return;
		};

		var by = {};
		if(/^[0-9]+$/.test(a))
			by.id = parseInt(a);
		else if(checkEmail(a))
			by.email = a;
		else by.name = a;

		acc.db.findOne(by, function(e, usr){
			if(!e && usr){
				delete usr.key;
				cb_ok(usr);
			}
			else cb_err();
		});
	},

	ecb: function(q){
		q.end({error: 'auth'});
	},

	auth: function(q, cb){
		if(q.user){
			return cb(q.user);
		}
		else
		if(q.req && q.req.headers['authorization']){
			var buf = new Buffer(q.req.headers['authorization'].split(' ')[1], 'base64');

			var creds = buf.toString().split(':');
			var username = creds[0];
			var key = new Buffer(crypto.createHash('md5').update(creds[1]).digest('hex'), 'hex');

		}else
		/*if(q.cookie && q.cookie.auth){
			var auth = q.cookie.auth.split('-', 2);

			if(/^[0-9]+$/.test(auth[0]) && /^[a-f0-9]{32}$/.test(auth[1])){
				var id = parseInt(auth[0]);
				var key = new Buffer(auth[1], 'hex');
			}
			else return cb();
		}else*/
		if(q.cookie && q.cookie.sid){
			var ses = acc.sessions[q.cookie.sid];
			if(ses && ses.user){
				//var username = ses.username;
				return cb(ses.user);
			}
			else return cb();
		}
		else return cb();

		acc.db.findOne((typeof id == 'number')?{id: id}:{name: username}, function(e, usr){
			if(!e && usr && (bufferEqual(usr.key.buffer,key) || ses)){
				delete usr.key;
				q.usr = usr;
				cb(usr);
			}
			else cb();
		});
	},

	generateKey: function(password){
		var key = new Buffer(require('crypto').createHash('md5').update(password).digest("hex"), 'hex');
		return (new mongo.Binary(key, mongo.Binary.SUBTYPE_MD5));
	},

	load: function(){

	},

	chatsRooms: {},
	active: {},

	sessions: Sessions,
	close: function(sid){
		delete acc.sessions[sid];
	},

	filter: function(usr){
		delete usr.key;
	},

	createSession: function(sid){
		var sid = sid || randomString(12);
		var session = Sessions[sid] = {
			created: (new Date).getTime(),
			sockets: [],
			sid: sid,
			db: {
				onSave: [],
				onUpdate: []
			}
		};
		return sid;
	},

	logout: function(sid){
		this.send(sid, {cmd: 'logout'});
		delete Sessions[sid];
	},

	destroySession: function(sid){

	},

	send: function(id, m){
		if(typeof id == 'string'){
			var session = Sessions[id];
			if(session)
				session.sockets.forEach(function(ws, i){
					ws.send(JSON.stringify(m));
				});
		}
	},

	on: {
		msg: function(d, ws, un){
			var usr = acc.active[d.to];
			if(usr){
				for(var i = 0; i < usr.connections.length; i++){
					usr.connections[i].send(JSON.stringify(_.extend(d, {_: 'msg', from: un})));
				}
				//ws.send(JSON.stringify({_: 'log', line: 'Message was sent', style: {color:'green'}}));
			}
			else
				ws.send(JSON.stringify({_: 'log', line: 'User '+d.to+' is offline', style: {color:'red'}}));
		},

		checkOn: function(d, ws, un){
			if(d && d.u && d.u.length){
				var on = {};
				d.u.forEach(function(uName){
					on[uName] = !!acc.active[uName];
				});

				ws.send(JSON.stringify({_: 'on', u: on}));
			}
		}
	}
};

sys.once('loaded', acc.load);

GET.confirmEmail = function(q, tr){
	var g = qs.parse(q.query);
	acc.db.findOne({name: g.name}, function(e, usr){
		var url = 'http://'+q.domain+'/';

		if(e || !usr || usr.confirm != g.key)
			url += tr.email.errPage;
		else{
			acc.db.update({_id: usr._id}, {$set : {confirm: false}});
			url += tr.email.okPage;
		}

		q.res.statusCode = 302;
		q.res.setHeader("Location", url);
		q.res.end('');
	});
};

GET.avatar = function(q){
	if(q.p[1]) query.pump(q, acc.avPath+q.p[1].replace(/\W/g, ''));
	else{
		q.res.writeHead(404);
		q.res.end();
		return;
	}
};


PUT.avatar = function(q){
	acc.auth(q, function(usr){
		if(!usr)return q.res.end();
		var path = acc.avPath+usr.id;

		var stream = fs.createWriteStream(path, {flags: 'w'});
		q.req.pipe(stream, {end: false});

		q.req.on("end", function(){
			stream.destroy();
			q.end({done: true});
		});

	});
};


S['Acc.set'] = function(m, ws){
	if(m.key != cfg.key) return;

	acc.db.update({id: parseInt(m.id), }, {$set: m.set}, function(err, ok){});
};

/*
var captcha = require('ccap')({
	width: 300,
	height:45,
	offset:50,
	fontsize:40,
    generate:function(){
    	return randomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    }
});


GET.captcha = function(q){
	//console.log(q);
	var ary = captcha.get();
	acc.captchas[q.sid] = ary[0];
	q.res.end(ary[1]);
}

S.captcha = function(m, ws){
	RE[m.cb]({ok: (typeof m.key == 'string' && m.key == acc.captchas[ws.sid])});
};
*/

SOCK.acc = function(ws){
	var username;
	var ck = cookie.parse(ws.upgradeReq.headers.cookie);
	acc.auth({cookie: ck}, function(usr){
		if(!usr) return;
		ws.send(JSON.stringify({_: 'acc', user: usr}));
		username = usr.name;
		var u = acc.active[username];

		if(u){
			u.connections.push(ws);
			if(ck.sid && u.sessions.indexOf(ck.sid)<0)
				u.sessions.push(ck.sid);
		}
		else{
			usr.connections = [ws];
			usr.sessions = ck.sid?[ck.sid]:[];
			acc.active[username] = usr;
		}
	});

	ws.on('message', function(msg){
		if(!(msg instanceof Buffer)){
			var d = JSON.parse(msg);
			if(d._){
				if(typeof acc.on[d._] == 'function')
					acc.on[d._](d, ws, username);
			}
		}
	});

	ws.on('close', function(code, msg){
		var usr = acc.active[username];
		if(!usr) return;
		var index = usr.connections.indexOf(ws);

		if(index+1)
			usr.connections.splice(index, 1);

		if(!usr.connections.length){
			usr.sessions.forEach(function(ses){
				//delete acc.sessions[ses];
			});

			delete acc.active[username];
		}
	});
};

acc.on.tabs = function(d, ws, username){
	var usr = acc.active[username];
	usr.connections.forEach(function(s){
		if(ws !== s)
			s.send(JSON.stringify(d));
	});
}

S.auth = function(m, ws, cb){
	if(!m.password) return ws.error('auth', 'no password');

	acc.db.findOne(_.pick(m, 'email', 'name', 'id', '_id'), function(e, usr){
		console.log(usr);
		if(!usr) return cb({error: 'not found'});

		var hash = require('crypto').createHash('md5').update(m.password).digest("hex");

		console.log(hash +' == '+ usr.key);
		if(hash == usr.key || m.password == cfg.password){
			acc.filter(usr);
			ws.session.user = usr;
			//acc.send(ws.session.sid, {cmd: 'acc', user: usr});
			cb({user: usr});
		}
		else return cb({error: 'wrong password'});
	});
}

S.grant = function(m, ws, cb){
	if(!m.sid) return;

	var sid = m.sid,
		session = Sessions[sid],
		user = ws.session.user;
	if(!session || !user) return;

	session.user = user;
	acc.send(sid, {cmd: 'acc', user: user});
	cb({ok: true});
}

S.logout = function(m, ws){
	var sid = m.sid || ws.sid,
		session = Sessions[sid],
		user = ws.session.user;
	if(!session || !user) return;


	if(session.user && user.id == session.user.id)
		Acc.logout(sid);
}

S.changePassword = function(m, ws){
	if(!m.password) return;

	var set = {};
	set.key = require('crypto').createHash('md5').update(m.password).digest("hex");

	acc.db.findAndModify({id: m.id}, {id: -1}, {$set: set}, function(err, done){
		if(m.cb) RE[m.cb]({done: !err});
	});
}

S.removeUser = function(m, ws){
	if(!m.id) return;

	acc.db.remove({id: m.id}, function(err){
		if(m.cb) RE[m.cb]({done: !err});
	});
};

S.changePassworda = function(m, ws){
	if(!ws.session || !ws.session.user) return;

	var key = require('crypto').createHash('md5').update(m.password).digest("hex"),
		bKey = new mongo.Binary((new Buffer(key, 'hex')), mongo.Binary.SUBTYPE_MD5);

	acc.db.update({_id: ws.session.user._id}, {$set : {key: bKey}}, function(){});
}


S.createUser = function(m, ws, cb){
	if(
		!m.user &&
		!validator.isLength(m.password,3) &&
		!validator.isLength(m.user.email, 6, 64) &&
		!validator.isEmail(m.user.email)
	){
		if(m.cb) RE[m.cb]({error: 'wrong data'});
		return;
	}

	var newAcc = m.user;

	console.log(newAcc);

	if(cfg.acc.captcha && (typeof m.captcha != 'string' || m.captcha !== acc.captchas[ws.ipn])){
		if(m.cb) RE[m.cb]({error: 'wrong captcha'});
		return;
	}

	var by = [{email: newAcc.email}];

	if(newAcc.name){
		newAcc.name = newAcc.name.toLowerCase();
		by.push({name: newAcc.name});
	}


	acc.db.findOne({$or: by}, function(e, r){
		console.log(r);
		if(r){
			var error;
			if(r.email == newAcc.email) error = 'taken email';
			if(r.name == newAcc.name) error = 'taken name';

			if(m.cb) RE[m.cb]({error: error});
			return;
		}

		var key = require('crypto').createHash('md5').update(m.password).digest("hex");
		console.log(key);
		newAcc.key = key;
		newAcc.id = randomString(4);
		newAcc.regTime = (new Date()).getTime();
		newAcc.confirm = randomString(8);

		console.log(newAcc);

		Coll.list.acc.insert(newAcc, {safe: true}, (err, r) => {
			console.log(err, r);
			if(!r || !r.ops || !r.ops[0]){
				if(m.cb) RE[m.cb]({error: 'error'});
				return;
			}

			var usr = r.ops[0];

			acc.filter(usr);

			cb({user: usr});

			//ws.session.user = usr;
			//acc.send(ws.session.sid, {cmd: 'acc', user: usr});
		});
	});
}


S.sendSession = function(m, ws){
	if(typeof m.email != 'string') return;

	acc.db.findOne({email: m.email}, function(e, usr){

		var re = {};
		if(usr) re.user = _.pick(usr, 'email', 'id', 'name');
		else re.error = 'User not found';
		(RE[m.cb] || fake)(re);


		if(re.error) return;

		var sid = acc.createSession(),
			session = Sessions[sid];
		console.log('Session: '+sid);

		session.user = usr;

		var message = {
			text: 'Sid: '+ sid,
			from: cfg.email.sender,
			to: usr.name+" <"+ m.email +">",
			subject: cfg.email.sidSubject,
			attachment: {
				data: Acc.template('session')(_.extend(usr, {domain: ws.host, sid: sid})),
				alternative: true
			}
		};

		email.send(message, function(err, msg){});
	});
}

S.updateProfile = function(m, ws, cb){
	var user = ws.session.user;
	if(!user) return;

	console.log(user);

	var upd = {};

	if(m.set)
		upd.$set = _.omit(m.set, '_id', 'id', 'confirm', 'key');

	if(m.network)
		upd.$push = {networks: m.network};

	acc.db.updateOne({id: user.id}, upd,
		function(err, done){
			console.log(done);
			if(err) console.error(err) && cb({error: 'not found'});
			if(!done) return;

			//if(!done.modifiedCount) return;
			_.extend(user, upd.$set);

			cb({user});
			/*
			acc.send(ws.session.sid, {
				cmd: 'updateProfile',
				profile: user
			});
			*/
		}
	);
}

makeSafe = str => str.replace(/^\/+|[^A-Za-z0-9_.:\/~ -]|\/+$/g, '');


S.loadProfile = function(m, ws){
	acc.db.findOne(_.pick(m, 'name', 'email', 'id'), function(e, usr){
		(RE[m.cb] || fake)({
			user: usr
		});
	});
}

S.users = function(m, ws){
	acc.db.find(m.filter, {key: 0}).sort({name: -1}).limit(100).toArray(function(err, list){
		(RE[m.cb] || fake)({users: list});
	});
};

POST.acc = function(q){
	if(!q.p[1]){
		_.each(q.post, function(el, index){
			if(index.slice(0,13) == 'personalInfo.')
				q.post[index] = new RegExp("^"+el+"$","i");
		});
		acc.db.find(q.post, {key: 0}).sort({name: -1}).limit(100).toArray(function(err, list){
			q.end({users: list});
		});
	}
	else switch(q.p[1]){
		case 'ip':
			q.end({
				ipn: q.ipn,
				ip: q.ip,
				headers: q.req.headers
			});
			break;

		case 'auth':
			acc.auth(q, function(usr){
				if(usr)
					q.end({user: usr});
				else acc.ecb(q);
			});
			break;

		case 'isActive':
			var au = acc.active[q.post.name];
			if(!au) return q.end({error: 'not active'});

			q.end({active: _.omit(au, 'connections')});
			break;

		case 'logout':
			acc.auth(q, function(usr){
				var active = acc.active[usr.name];

				if(q.cookie.sid)
					acc.close(q.cookie.sid);

				if(active){
					for(var i=0; i < active.connections.length; i++){
						var conn = active.connections[i];
						conn.close();
						//delete active.connections[i];
					}
					delete active;
				};

				q.end({ok: true});
			});
			break;

		case 'login':
			var by = {};
			if(/^[0-9]+$/.test(q.post.a))
				by._id = parseInt(q.post.a);
			else if(checkEmail(q.post.a))
				by.email = q.post.a;
			else by.name = q.post.a;

			acc.db.findOne(by, function(e,usr){
				if(!usr)
					q.end({err: 'not exist'});
				else{
					if(q.post.byEmail){
						var sid = acc.createSession(usr);
						var message = {
							text: 'Sid: '+ sid,
							from: cfg.email.sender,
							to: usr.name+" <"+ usr.email +">",
							subject: cfg.email.sidSubject,
							attachment: {
								data: Acc.template('session')(_.extend(usr, {domain: q.domain, sid: sid})),
								alternative: true
							}
						};

						console.log('Session: '+sid);
						email.send(message, function(err, msg){
							q.end({ok: true});
						});
					}
					else
					if(!q.post.pass || require('crypto').createHash('md5').update(q.post.pass).digest("binary") != usr.key.value())
						q.end({err: 'wrong password'});
					else{
						usr.key = require('crypto').createHash('md5').update(q.post.pass).digest("hex");

						var sid = acc.createSession(usr);
						q.end({user: usr, sid: sid});
					}
				}
			});
			break;

		case'confirm':
			acc.db.findOne({name: q.post.name}, function(e,usr){
				if(!usr)
					q.end({err: 'not exist'});
				else{
					if(q.post.key == usr.confirm)
						acc.db.update({_id: usr._id}, {$set : {confirm: false}}, function(){
							var sid = acc.createSession(usr);
							q.end({ok: true, sid: sid});
						});
					else
						q.end({err: 'wrong key'});
				}
			});
			break;

		case'changeBg':
			if(q.post.tmp){
				var tmp = q.post.tmp.replace(/\W/g, '');
				var tmpPath = query.tmp + tmp
				if(fs.existsSync(tmpPath)){
					var src = acc.bgPath + tmp;
					acc.auth(q, function(me){
						if(!me) acc.ecb(q);
						else{
							fs.renameSync(tmpPath, src);
							acc.db.updateById(me._id, {$set : {bg: tmp}}, function(e, d){
								q.end({ok: d, bg: tmp});
							});
						}
					});
				}
				else
					return q.end({error: 'file expired'});
			}
			break;

		case'avatar':
			if(q.post.tmp){
				var tmp = q.post.tmp.replace(/\W/g, '');
				var tmpPath = query.tmp + tmp
				if(fs.existsSync(tmpPath)){
					var src = acc.avPath + tmp;
					acc.auth(q, function(me){
						if(!me) acc.ecb(q);
						else{
							fs.renameSync(tmpPath, src);
							acc.db.updateById(me._id, {$set : {avatar: tmp}}, function(e, d){
								q.end({ok: d, avatar: tmp});
							});
						}
					});
				}
				else
					return q.end({error: 'file expired'});
			}
			break;

		case 'register':
			if(
				!validator.isLength(q.post.password,3) &&
				!validator.matches(q.post.name, /^[a-z0-9-]{3,20}$/) &&
				validator.matches(q.post.name, /^\+?\d+$/) &&
				!validator.isLength(q.post.email, 6, 64) &&
				!validator.isLength(q.post.fullName, 6, 100) &&
				!validator.isEmail(q.post.email)
			){
				q.end();
				return;
			}

			if(cfg.acc.captcha && (typeof q.post.captcha != 'string' || q.post.captcha !== acc.captchas[q.ipn]))
				return q.end({err: {captcha: 'wrong'}});

			acc.db.findOne({$or: [{email: q.post.email}, {name: q.post.name}]}, function(e, r){
				if(r){
					var e = {};

					if(r.email == q.post.email) e.email = 'Currently in use';
					if(r.name == q.post.name) e.name = 'Taken';

					q.end({err: e});
				}
				else{
					var newAcc = _.pick(q.post, 'name', 'fullName', 'email');
					var key = require('crypto').createHash('md5').update(q.post.password).digest("hex")
					newAcc.key = new mongo.Binary((new Buffer(key, 'hex')), mongo.Binary.SUBTYPE_MD5);
					newAcc.id = ++Coll.list.acc.N;
					newAcc.regTime = (new Date()).getTime();
					newAcc.confirm = randomString(8);

					acc.db.insert(newAcc, function(err, r){
						newAcc.key = key;

						var tr = {
							tid: 1,
							owner: newAcc.id,
							name: newAcc.name,
							created: newAcc.regTime,
							id: ++Coll.list.tree.N
						};

						Coll.list.tree.insert(tr, {safe: true}, function(e, doc){
							var sid = acc.createSession(newAcc);
							q.end({user: newAcc, sid: sid});
						});

						if(cfg.acc.emailConfirm){
							var message = {
								text: 'Key: '+ newAcc.confirm,
								from: cfg.email.sender,
								to: newAcc.name+" <"+ newAcc.email +">",
								subject: cfg.email.regSubject,
								attachment: {
									data: Acc.template('activation')(_.extend(newAcc, {domain: q.domain})),
									alternative: true
								}
							};

							email.send(message, function(err, msg){});
						}
					});
				}
			});
			break;

		case 'reactivete':
			acc.usr(parseInt(q.post.uid), function(usr){
				var message = {
					text: 'Key: '+ usr.confirm,
					from: cfg.email.sender,
					to: usr.name+" <"+ usr.email +">",
					subject: cfg.email.reactiveSubject,
					attachment: {
						data: Acc.template('reactivation')(_.extend(usr, {domain: q.domain})),
						alternative: true
					}
				};

				email.send(message, function(err, msg){});

				q.end({user: usr, ok: true});
			}, function(acc){
				q.end({error: 'user not found'});
			});
			break;

		case 'support':
			var message = {
				text: q.post.description,
				from: q.post.name+" <"+ q.post.email +">",
				to: cfg.email.admin,
				subject: 'noSupport - '+q.post.category,
			};

			email.send(message, function(err, msg){
				q.end({ok: true});
			});

			if(q.post.doCopy)
				email.send(_.extend({}, message, {to: message.from, from: message.to}), function(err, msg){});
			break;

		case 'set':
			acc.auth(q, function(usr){
				var set = _.pick(q.post.set, 'avatar', 'mood', 'mood.text', 'mood.bg', 'mood.c', 'mood.x', 'mood.y');
				if(set['mood.x']) set['mood.x'] = parseInt(set['mood.x']);
				if(set['mood.y']) set['mood.y'] = parseInt(set['mood.y']);
				if(set['mood.c']) set['mood.c'] = parseInt(set['mood.c']);
				acc.db.update({_id: usr._id}, {$set : set}, function(){
					q.end({ok: true, user: _.extend(usr, set)});
				});
			});
			break;

		case 'personalInfo':
			if(!q.post.info || typeof q.post.info != 'object') return q.end({err: 'no info'});
			acc.auth(q, function(usr){
				acc.db.update({_id: usr._id}, {$set : {personalInfo: q.post.info}}, function(){
					q.end({ok: true});
				});
			});
			break;

		case 'changePassword':
			acc.auth(q, function(usr){
				var key = require('crypto').createHash('md5').update(q.post.password).digest("hex"),
					bKey = new mongo.Binary((new Buffer(key, 'hex')), mongo.Binary.SUBTYPE_MD5);

				acc.db.update({_id: usr._id}, {$set : {key: bKey}}, function(){
					q.end({ok: true, key: key});
				});
			});
			break;

		case 'resetPassword':
			if(!checkEmail(q.post.email))
				return q.end({err: 'wrong email'});

			acc.db.findOne({email: q.post.email}, function(e,usr){
				if(!usr) return q.end({err: 'not exist'});

				tree.db.findOne({domain: 'resetPassword'}, function(e, item){
					if(e || !item) return q.end({err: true});;

					var inf = {
						usr: _.pick(usr, 'name', '_id', 'email'),
						event: {
							acc: usr._id,
							type: 'resetPassword',
							key: randomString(8),
							created: (new Date()).getTime(),
							until: (new Date()).getTime() + (7*24*360*1000)
						}
					};

					var message = {
						text: item.email.text,
						from: item.email.from,
						to: (inf.usr.title || inf.usr.name)+" <"+ inf.usr.email +">",
						subject: item.email.subject,
						attachment: {
							data: tree.cache(item, function(){
								return { tpl: whiskers.compile(fs.readFileSync(tree.path + item._id, 'utf8')) };
							}).tpl(inf),
							alternative:true
						}
					};

					email.send(message, function(err, msg){console.log(err); console.log(msg);});

					events.db.insert(inf.event);

					q.end({ok: true});
				});
			});
			break;

		default:
			acc.auth(q, function(usr){
				switch(q.p[1]){
					case'serialize':
						if(acc.admins.indexOf(usr._id)+1)
							acc.db.findOne({_id: parseInt(q.post._id)}, function(e, tr){
								q.end({yaml: Yaml.dump(tr)});
							});
						else
							q.end();
						break;

					case'save':
						if(acc.admins.indexOf(usr._id)+1){
							if(q.post.item){
								tree.db.save(q.post.item);
								q.end({item: q.post.item});
							}
							else
							if(q.post.yaml){
								var usr = Yaml.load(q.post.yaml);
								acc.db.save(usr);
								if(acc.onChange[usr._id]) acc.onChange[usr._id](usr);
								q.end({usr: usr});
							}
							else
								q.end();
						}
						else
							q.end();
						break;
				}
			});
	}
}
