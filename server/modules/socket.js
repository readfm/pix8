global.socket = {
	sendOthers: function(room, id, msg){
		var isBuf = (msg instanceof Buffer),
			 ob = isBuf?{}:JSON.parse(msg);
		for(var i = 0; i < room.on.length; i++){
			var client = room.on[i];
			if(client &&  i != id){
				if(!(ob && ob.to > -1 && ob.to != i))
					try{
						client.send(msg, {binary: isBuf});
					}catch (e){
						console.log(e);
					}
			}
		};
	},

	connected: function(ws){
		var req = ws.upgradeReq;
		var path = require('url').parse(req.url),
			road = ws.road = decodeURI(path.pathname).replace(/^\/+|[^A-Za-z0-9_.:\/~ -]|\/+$/g, ''),
			host = ws.host = req.headers.host,
			url = ws.url = ws.host + '/' + road,
			p = ws.p = road.split(/[\/]+/),
			get = ws.get = require('querystring').parse(path.query) || {},
			ip = ws.ip = req.headers['x-forwarded-for'] ||
		     req.connection.remoteAddress ||
		     req.socket.remoteAddress ||
		     req.connection.socket.remoteAddress,
			cookie = ws.cookie = require('cookie').parse(req.headers['cookie'] || '');

		console.log(_.pick(ws, 'host', 'cookie', 'url'));

		if(p[0])
			(SOCK[p[0]] || fake)(ws);
		else
			SOCKET(ws);
	},

	run: function(h){
		var d = {};
		if(typeof h == 'number')
			d.port = h;
		else d.server = h;

		var WebSocketServer = require('ws').Server,
			wss = new WebSocketServer(d);

		wss.on('connection', (ws, req) => {
			if(req) ws.upgradeReq = req;
			this.connected(ws);
		});
	}
}

global.SOCKET_prototype = {
	json: function(d){
		if(this.readyState !== 1) return;
		this.send(JSON.stringify(d));
	},

	error: function(ofCmd, msg, d){
		this.send(JSON.stringify(_.extend({cmd: 'error', ofCmd: ofCmd, msg: msg}, d)));
	},

	cb: function(cb, m){
		(RE[cb] || fake)(m);
	},

	putCB: function(m){
		var ws = this;
		RE[m.cb] = function(msg){
			var r = {cb: m.cb};
			_.extend(r, msg);
			ws.json(r);

			delete RE[m.cb];
		};

		setTimeout(function(){
			if(RE[m.cb]) delete RE[m.cb];
		}, 10 * 60 * 1000);
	}
};


global.SOCKET = function(ws){
	_.extend(ws, SOCKET_prototype);
	if(
		ws.cookie && ws.cookie.sid && Sessions[ws.cookie.sid] ||
		ws.get.sid && Sessions[ws.get.sid]
	)
		ws.session = Sessions[ws.get.sid || ws.cookie.sid];

	if(!ws.session){
		var sid = acc.createSession();
		ws.session = Sessions[sid];
	}

	ws.sid = sid || ws.cookie.sid;

	ws.session.sockets.push(ws);

	ws.json(_.extend(_.pick(ws.session, 'sid', 'user'), {cmd: 'session'}));

	ws.on('message', function(msg){
		if(typeof msg == 'string'){
			// missing closure bug.
			var ls = msg.substr(-1);
			if(ls != '}' && ls != ']')
				msg += '}';

			/*
			var mg = JSON.parse(msg);
			var m = function(r){
				(RE[mg.cb] || fake)(r);
			};

			_.extend(m, mg);
			*/

			var m = JSON.parse(msg);

			if(m.cb)
				ws.putCB(m);

			if(m.cmd){
				if(m.cmd == 'setSession')
					setSession(m.sid);

				var fn = S[m.cmd];
				if(fn){
					var cb = function(r){
						console.log(RE[m.cb]);
						if(m.cb && RE[m.cb]) RE[m.cb](r);
					};

					try {
						var r = fn(m, ws, cb);
					}
					catch(error){
					  console.error(error);
					}
				}
			}
		}
		else
		if(msg instanceof Buffer){
			if(!ws.stream) return ws.json({error: 'no stream'});

			console.log(ws.stream)

			ws.stream.write(msg, function(err){
				if(err) return console.log(clc.red(err.toString()));

				var tmpName = ws.stream.path.split('/').pop();
				ws.json({cmd: 'progress', b: ws.stream.bytesWritten});
			});
		}
	});

	ws.on('close', function(code, msg){
		if(ws.session)
			ws.session.sockets.forEach(function(sock, i){
				if(sock == ws)
					ws.session.sockets.splice(i,1);
			});
	});
}


chat = {
	u: {},
	history: {},

	pushHistory: function(username, room){
		var hA = chat.history[username];
		if(!hA)
			hA = chat.history[username] = [];

		var pos = hA.indexOf(room);
		if(pos+1) hA.splice(pos, 1);
		hA.push(room);
	}
}


var rooms = {};
SOCK.paint = SOCK.chat = function(ws){
	var room = rooms[ws.p[1]];
	if(typeof room !== 'object')
		room = rooms[ws.p[1]] = {on: []};

	var id = room.on.push(ws) - 1;

	var online = [];
	for(var i = 0; i < room.on.length; i++){
		if(room.on[i]) online.push(i);
	}


	var username;
	acc.auth({cookie: cookie.parse(ws.upgradeReq.headers.cookie || '')}, function(usr){
		if(usr) username = usr.name;
		if(!room.admin && username)
			room.admin = usr.id;

		ws.user = usr;

		ws.send(JSON.stringify({type: 'hi', id: id, online: online,  user: usr}));
		socket.sendOthers(room, id, JSON.stringify({_: 'connected', id: id, user: usr}));
	});


	ws.on('message', function(msg){
		if(typeof msg == 'string'){
			var m = JSON.parse(msg);

			if(ws.user)
				m.sender = ws.user.id;

			msg = JSON.stringify(m);
		}

		socket.sendOthers(room, id, msg);
	});

	ws.on('close', function(code, msg){
		var n = 0;
		for(var i = 0; i < room.on.length; i++){
			if(i == id)
				room.on[i] = null;

			if(room.on[i] === null)
				n++;
		};

		if(room.on.length == n)
			delete rooms[ws.p[1]];
		else
			socket.sendOthers(room, id, JSON.stringify({_: 'disconnected', id: id, un: username}));
	});
};

/*
SOCK.paint = function(ws){
	var path = require('url').parse(ws.upgradeReq.url),
		url = ws.upgradeReq.headers.host + '/' + decodeURI(path.pathname).replace(/^\/+|[^A-Za-z0-9_.:\/~ -]|\/+$/g, '');

	var room = rooms[url];
	if(typeof room !== 'object')
		room = rooms[url] = [];

	var id = room.on.push(ws) - 1;

	var online = [];
	for(var i = 0; i < room.length; i++){
		if(room[i]) online.push(i);
	}

	ws.send(JSON.stringify({type: 'hi', id: id, online: online}));
	socket.sendOthers(room, id, JSON.stringify({type: 'connected', id: id}));
	ws.on('message', function(msg){
		socket.sendOthers(room, id, msg);
	});

	ws.on('close', function(code, msg){
		var n = 0;
		for(var i = 0; i < room.length; i++){
			if(i == id)
				room[i] = null;

			if(room[i] === null)
				n++;
		};

		if(room.length == n)
			delete rooms[url];
		else
			socket.sendOthers(room, id, JSON.stringify({type: 'disconnected', id: id}));
	});
};
*/

POST.sock = function(q){
	if(!q.p[1]){
		acc.db.find(q.post, {key: 0}).sort({_id: -1}).limit(100).toArray(function(err, list){
			q.end({users: list});
		});
	}
	else switch(q.p[1]){
		case 'chatHistory':
			acc.auth(q, function(usr){
				if(usr)
					q.end({rooms: chat.history[usr.name]});
				else acc.ecb(q);
			});
			break;

		case 'describe':
			var room = rooms[q.post.room];
			if(!room) return q.end({error: 'wrong room'});
			if(typeof q.post.description != 'string') return q.end({error: 'wrong description'});

			acc.auth(q, function(usr){
				if(usr.id == room.admin){
					room.description = q.post.description;
					q.end({ok: true});
				}
				else
					q.end({error: 'you have no rights'});
			});
			break;

		case 'onRoom':
			var room = rooms[q.post.room];
			if(!room || !room.on || !room.on.length) return q.end({error: 'room is empty'});

			var names = [],
				 users = [];
			room.on.forEach(function(ws){
				if(ws && ws.user){
					if(names.indexOf(ws.user.name)<0){
						names.push(ws.user.name);
						users.push(ws.user);
					}
				}
			});

			q.end({online: users, description: room.description});
			break;
	}
};
