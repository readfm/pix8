window.WSL = function(server, cb){
	var t = this;
	this.connection = new WebSocket(server);
	this.connection.binaryType = "arraybuffer";
	
	this.on = {};
	
	if(cb) this.connection.onopen = cb

	this.connection.onmessage = function(msg){
		t.message(msg);
	};
	this.connection.onclose = function(){
		//$('.stream-download').hide();
		Local.files = [];
	};
	
	this.connection.onerror = function(error){
		console.log(error);
		//modal.show('noConnection');
	};
}


WSL.prototype = {
	online: {},
	cbs: {},

	send: function(msg, cb){
		if(!msg) return;
		
		if(cb){
			if(!msg.cb) msg.cb = randomString(15);
			this.cbs[msg.cb] = cb;
		}
		this.connection.send(JSON.stringify(msg));

		return msg.cb;
	},
	
	message: function(msg){
		if(msg.data instanceof ArrayBuffer)return;
		
		msg = JSON.parse(msg.data);

		var cb;
		if(msg.cb && (cb = this.cbs[msg.cb])) cb(msg);

		if(this.on[msg.cmd])
			this.on[msg.cmd](msg);
	}
};

window.Local = {
	ip: '127.0.0.1:9001',
	on: {
		'local.downloaded': function(m){
			console.log('Downloaded: '+m.id);
		},

		'local.files': function(m){
			Local.files = m.files;
		},

		'local.add': function(m){
			Local.files.push(m.file);
		},

		'local.remove': function(m){
			var index = Local.files.indexOf(m.file);
			Local.files.splice(index, 1);
		},

		alert: function(msg){
			alert(msg.text);
		}
	},

	files: [],

	isReady: function(){
		return Local.ws && Local.ws.connection.readyState == 1;
	},

	connect: function(){
		Local.ws = new WSL('ws://'+Local.api, function(){
		});
		Local.ws.on = Local.on;
	},

	timeout: 9000,
	ping: function(callback){
		var img = new Image;
		img.onload = callback;
		img.enerror = function(ev){
			console.log(ev);
		};
		img.src = 'http://'+Local.ip;
	},

	files: [],
	checkFiles: function(){
		ws.send({
			cmd: 'load',
			collection: 'scores',
			filter: {
				tid: active.id
			},
			sort: {time: -1}
		}, function(r){
			Local.files = r.files;
		});
	}
};
Local.api = Local.ip+'/local/',


(function(){
	if(!Cfg.local) return;
	Local.connect();
	setInterval(function(){
		if(!Local.isReady())
			Local.connect();
	}, Local.timeout);
})();