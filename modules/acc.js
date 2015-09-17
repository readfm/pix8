window.acc = {
	user: false,
	u: {},
	uN: {},
	users: function(ids, cb){
		if(typeof ids != 'object') return false;
		
		var find = [],
			 fNames = [];
		ids.forEach(function(id, i){
			if(isNaN(id)){
				if(!acc.uN[id])
					fNames.push(id);
			}
			else{
				if(!acc.u[id])
					find.push(id);
			}
		});
		
		if(find.length || fNames.length)
			$.query("acc", {$or :[{id: {$in: find}}, {name: {$in: fNames}}]}, function(r){
				r.users.forEach(function(u){
					acc.u[u.id] = u;
					acc.uN[u.name] = u;
				});
				cb(acc.u);
			});
		else cb(acc.u);
	},
	
	updateList: function(users){
		users.forEach(function(u){
			acc.u[u.id] = u;
			acc.uN[u.name] = u;
		});
	},
	
	on: [],
	ok: function(user){
		acc.user = user;
		$('#auth, #registration').hide();

		$('#acc').show();
		$('#user-fullName').text(acc.user.fullName);
		$('#avatar').css('background-image', "url('/avatar/"+acc.user.id+"')");

		$('.a').show();
		$('.na').hide();

		acc.u[acc.user.id] = acc.user;
		acc.uN[acc.user.name] = acc.user;
		acc.on.forEach(function(f){
			f(acc.user);
		});
	},

	out: function(){
		$('.na').show();
		$('.a').hide();
		acc.user = false;
		$.cookie('sid', null);
	}
}

S.acc = function(m){
	acc.ok(m.user);
}

$(function(){
	if(acc.user) acc.ok();

	$('#user-logOut').click(function(){
		acc.out();
	});

	var cb = randomString(9);
	$('#twitter').attr('href', 'http://pix8.0a.lt/auth/twitter');

	$('.a').hide();
	$('.na').show();
});