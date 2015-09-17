window.WebSocket = window.WebSocket || window.MozWebSocket;	

window.WS = function(room){
	var t = this;
	this.room = room;
	
	var port = location.port?(':'+location.port):'';
	this.connection = new WebSocket('ws://'+document.domain+port+'/'+room);
	this.connection.binaryType = "arraybuffer";
	
	this.on = {
		alert: function(msg){
			alert(msg.text);
		}
	};
	
	this.connection.onmessage = function(msg){
		t.message(msg);
	};
	this.connection.onclose = function(){};
	
	this.connection.onerror = function (error){
		//modal.show('noConnection');
	};
}

WS.prototype = {
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
	
	move: function(x,y){
		var buf = new ArrayBuffer(5),
			arr = new Uint8Array(buf);

		arr[0] = ws.id;
		arr[1] = ((x & 0xff00) >> 8);
		arr[2] = (x & 0x00ff);
		arr[3] = ((y & 0xff00) >> 8);
		arr[4] = (y & 0x00ff);
		
		this.connection.send(buf);
	},
	
	message: function(msg){
		if(msg.data instanceof ArrayBuffer){
			var arr = new Uint8Array(msg.data);
			this.draw(arr[0], (arr[1] << 8) + arr[2], (arr[3] << 8) + arr[4]);
			return;
		};
		
		msg = JSON.parse(msg.data);

		var cb;
		if(msg.cb && (cb = this.cbs[msg.cb])) cb(msg);

		if(this.on[msg.cmd])
			this.on[msg.cmd](msg);
	}
};

var ws = window.ws = new WS('');
ws.connection.onopen = function(){
	//ws.send({cmd: 'setSession', sid: $.cookie('sid')});
}

window.S = ws.on;

S.session = function(m){
	console.log(m);
	$.cookie('sid', m.sid);
	if(m.user) acc.ok(m.user);
}

S.error = function(m){
	if(m.ofCmd && S.error[m.ofCmd])
		S.error[m.ofCmd](m);
}

S.error.auth = function(m){
	console.log(m);
}