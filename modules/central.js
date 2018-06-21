window.Central = {
  connect: q => {
		var ws = Central.ws = new WS({
			server: /*window.isElectron?'localhost:81':*/Cfg.central.server,
			sid: Cookies.get(Cfg.sidCookie),
			name: 'main'
		});

		var S = ws.on;
		Central.W = (msg, cb) => {ws.send(msg, cb)};

		S.session = function(m){
			Cookies.set(Cfg.sidCookie, m.sid);
			//if(m.user) acc.ok(m.user);
			Central.session = m;
		}

		S.error = function(m){
			if(m.ofCmd && S.error[m.ofCmd])
				S.error[m.ofCmd](m);
		}
	},

  fetchView: function(path){
    return new Promise((resolve, reject) => {
      Central.W({
        cmd: 'load',
        filter: {path, type: 'view', owner: 'dukecr'},
        sort: {updated: -1},
        collection: 'pix8'
      }, function(r){
        if(Pix8.items[path] === true)
          delete Pix8.items[path];

        if(!r.items || !r.items.length){
          return resolve();
        }

        var view = r.items[0];
        view.tag = path;
        var ids = [];

        var link = new Link(Pix8.sites_link+md5(url)+'.yaml');

        if(view.items)
          Central.W({
            cmd: 'load',
            filter: {
              id: {$in: view.items},
            },
            collection: 'pix8'
          }, function(r){
            var ids = [];
            (r.items || []).forEach(item => {
              if(item.file) console.log('File:', item.file);
              Data.save(item);
            });

            Pix8.linkView(view);
            console.log('Saved: ', view.tag);

            resolve();
          });
        else
          resolve();
      });
    });
  },

  items: [],
  collect: function(){
    if(!Central.items || !Central.items.length) return;

    var view = Central.items.pop();
    if(view.path && !Pix8.items[view.path]){
      Pix8.items[view.path] = true;
      Central.fetchView(view.path).then(Central.collect);
    }
    else{
      console.log('Already: ', view.path);
      Central.collect();
    }
  },

  list: function(filter){
    filter = $.extend({
    //  path: {$regex: "^(?!http).+"},
      type: "view",
      owner: 'dukecr'
    }, filter);

    Central.W({
      cmd: 'load', filter,
      sort: {
        updated: -1, time: -1
      },
      mod: {
        id: -1,
        path: -1
      },
      collection: 'pix8'
    }, r => {
      Central.items = r.items;

      Central.collect();
    });
  }
}
