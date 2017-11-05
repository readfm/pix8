var Pix8acc = {
  user: false,
  avatar: new Image,
  onAvatar: [],
  u: {},
  uN: {},
  home: (document.location.host.indexOf('.lh')+1)?'http://pix8io.lh/':'http://io.cx/',
  users: function(ids, cb){
    if(typeof ids != 'object') return false;

    var find = [],
       fNames = [];
    ids.forEach(function(id, i){
      if(isNaN(id)){
        if(!t.uN[id])
          fNames.push(id);
      }
      else{
        if(!t.u[id])
          find.push(id);
      }
    });

    if(find.length || fNames.length)
      $.query("acc", {$or :[{id: {$in: find}}, {name: {$in: fNames}}]}, function(r){
        r.users.forEach(function(u){
          t.u[u.id] = u;
          t.uN[u.name] = u;
        });
        cb(t.u);
      });
    else cb(t.u);
  },

  updateList: function(users){
    var t = this;
    users.forEach(function(u){
      t.u[u.id] = u;
      t.uN[u.name] = u;
    });
  },

  on: [],
  ok: function(user){
    var t = this;
    if(!user) return;

    this.user = user;
    $.extend(User, user);
    User.name = user.id;

    $('#pix8-auth').hide();
    $('#pix8-authFrame').hide();

    $('#pix8-acc').show();
    $('#pix8-fullName').text(this.user.fullName || this.user.name);

    if(user.avatar)
      $('#pix8-avatar').css('background-image', 'url('+Cfg.files+user.avatar+')');

    $('.a').show();
    $('.na').hide();

    if(user.super)
      $('.super').show();

    this.u[this.user.id] = this.user;
    this.uN[this.user.name] = this.user;
    this.on.forEach(function(f){
      f(t.user);
    });
  },

  off: [],
  out: function(){
    $('.na').show();
    $('.a').hide();
    this.user = false;

    $('.super').hide();

    this.off.forEach(function(f){
      f();
    });
  },

  init: function(){
    var t = this;

    $acc = $('<div>', {id: 'pix8-acc', class: 'a'}).appendTo('#pic');
    $('<div>', {id: 'pix8-avatar'}).appendTo($acc);
    $('<div>', {id: 'pix8-fullName'}).text('Full Name').appendTo($acc);

    $('<span>', {id: 'pix8-logout', title: 'LogOut'}).html('&#10006;').appendTo($acc).click(function(){
      t.out();
      $('#pix8-authFrame').remove();
      Cookies.remove(Cfg.sidCookie);
    });


    $auth = $('<div>', {id: 'pix8-auth', class: 'na'}).appendTo('#pic').text('login');

    /*
    $auth.click(function(){
  		window.open(Cfg.auth.site+'#'+t.sid, '_blank', {
				height: 200,
				width: 300,
				status: false
			});
  	});
    */

    this.initEvents();
  },

  initEvents: function(){
    $('#pix8-auth').click(function(){
      Pix8acc.toggleAuth();
    });

    $(window).click(function(ev){
      if($(ev.target).is('#pix8-fullName, #pix8-auth')) return;
      $('#pix8-authFrame').hide();
    });
  },

  toggleAuth: function(){
    if($('#pix8-authFrame').length){
      $('#pix8-authFrame').toggle();
      return;
    }

    var $iframe = $('<iframe>', {
      id: 'pix8-authFrame',
      src: Cfg.auth.site+'#'+this.sid
    });

    $iframe.show().appendTo('#pic');
  }
};

$('<link>').attr({
    type: 'text/css',
    rel: 'stylesheet',
    href: Pix8acc.home+'pix8/acc.css'
}).appendTo('head');

Pix.ready.push(function(session){
  Pix8acc.sid = session.sid;
  Pix8acc.init();

  Pix8acc.out();

  if(session.user)
    Pix8acc.ok(session.user);

  ws.cmd('acc', function(m){
  	Pix8acc.ok(m.user);
  });
});
