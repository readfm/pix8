global.log = console.log;

global.clc = require('cli-color');
global._ = require('lodash');
global.EventEmitter = require('events').EventEmitter;

process.on('uncaughtException', function(err){
	if(err.stack) console.log(clc.red(err.stack));
	else console.log(err);
});

global.fs = require('fs');
global.util = require('util');
global.YAML = require('yamljs');
global.cookie = require('cookie');

global.SITE = {};
global.POST = {};
global.GET = {};
global.POST_ = {};
global.GET_ = {};
global.PUT = {};
global.SOCK = {};
global.RE = {
	void: function(m){}
};
global.S = {};
global.Sessions = {};

global.ecb = function(e){
	console.log(e);
};

global.api = {
	check:{},
};

global.mod = {};
global.sys = new EventEmitter();
sys.setMaxListeners(900);


var stdin = process.openStdin();
stdin.setEncoding('utf8');

stdin.on('data', function (input){
	console.log(eval(input));
});

global.cfg = global.Cfg = YAML.load('./api.yaml');

var Pineal = {
	loadModules: () => {
		cfg.modules.forEach((name) => {
			var file = Cfg.path.modules + name + '.js';

			var module = mod[name] = require(file);
			console.log('load module: '+name);

			if(cfg.devMode)
				fs.watchFile(file, function(curr, prev){
					console.log(clc.yellow(curr.mtime.toString()) +' '+ clc.blue(name));
					delete require.cache[require.resolve(file)];
					require(file);
					if(module._reload) module._reload();
				});
		});
		process.emit('loadedModules');
	}
}


Pineal.loadModules();
sys.emit('loaded');


if(Cfg.http){
	global.http = require('http').createServer(query.serv);

	http.listen(Cfg.http.port, function(err){
		if(err) return cb(err);

		var uid = parseInt(process.env.SUDO_UID);
		if(uid) process.setuid(uid);

		console.log(clc.green.bold('http server is running on :') + Cfg.http.port);
	});

	socket.run(http);
}

if(Cfg.https && global.Security){
	var https = require('https').createServer(Security.https_options, query.serv);
	https.listen(Cfg.https.port);
	socket.run(https);
}




process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason);
});

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
