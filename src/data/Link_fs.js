export default class Link_fs{
  constructor(url){
    this.url = this.link = url;

    this.supports = ['fs'];

    if(url.indexOf('://')){
      var [protocol, way] = url.split('://');
      this.protocol = protocol;

      var hash_index = way.indexOf('#');
      if(hash_index + 1){
        this.id = way.substr(hash_index+1);
        way = way.substr(0, hash_index);
      }

      if(way){
        var sep = way.indexOf('/');
        this.host = this.hash = way.substr(0, sep);

        var index4port = this.host.indexOf(':')
        if(index4port + 1){
          this.domain = way.substr(0, index4port);
          this.port = way.substr(index4port + 1);
        }
        else{
          this.domain = this.host;
          this.port = 4000;
          this.host = this.domain + ':' + this.port;
        }

        this.path = way.substr(sep+1);

        this.uri = this.path.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');

      	this.p = this.uri.split(/[\/]+/);

        this.ext = this.path.split('.').pop();

        this.name = this.path.split('/').pop();
      }
    }

    this.collection = this.p[0];

    this.http = 'http://'+Cfg.host+':'+Cfg.port+'/'+protocol+'/'+way;
  }

  W(m, cb){
    this.constructor.servers.connect(this.host).then(ws => ws.send(m, cb));
  }

  update(set){
    return new Promise((ok, no) => {
      this.W({
        cmd: 'update',
        id: this.id,
        set,
        collection: this.collection
      }, r => {
        r.item?ok(r.item):no();
      });
    });
  }

  set(set){
    this.W({
      cmd: 'set',
      path: this.path,
      set
    });
  }

  download(cb){
    this.constructor.servers.connect(this.host).then(ws => {
      ws.download(this.path).then(function(data, file){
        cb(data, file);
      });
    });
  }

  upload_url(url, name){
    var path = url;
    if(name){
      var p = path.split('/');
      p.pop();
      p.push(name);
      path = p.join('/');
    }

    return new Promise((ok, no) => {
      this.constructor.servers.connect(this.host).then(ws => {
        this.W({
          cmd: 'fs.download',
          url,
          path: this.path
        }, r => {
          r.done?ok(r):no(r);
        });
      });
    });
  }

  upload(data){
    return new Promise((ok, no) => {
      this.load(item => {
        this.constructor.servers.connect(this.host).then(ws => {
          ws.upload(data, file => {
            console.log(file);
            ok(file);
          }, {path: this.path});
        });
      });
    });
  }

  order(links){
    var children = [];
    links.forEach(link => {
      console.log(this, link,
        this.protocol+' == '+link.protocol,
        this.host+' == '+link.host,
        this.path+' == '+link.path
      );

      var p = link.url.split('/');
      p.pop();
      var folder = p.join('/').replace(/^\/|\/$/g, '');

      var isParent = (this.url.replace(/^\/|\/$/g, '') == folder);
      console.log(this.url.replace(/^\/|\/$/g, '')+' == '+folder);

      children.push(isParent?link.name:link.url);
    });

    this.set({children});
  }

  save(item){
    if(!item.id) item.id = this.id;
    return new Promise((ok, no) => {
      this.W({cmd: 'save', item, collection: this.collection}, r => {
        this.item = item;
        ok(item);
      });
    });
  }

  format(info){
    var item = {
      type: info.type,
      name: this.name,
      time: info.mtimeMs,
      size: info.size
    };

    return item;
  }

  load(cb){
    var itm = this.item;
    if(itm){
      if(itm instanceof Promise)
        return itm.then(item => cb(item));
      return cb(itm);
    }

    this.item = new Promise((k, n) => {
      this.W({
        cmd: 'fs.info',
        path: this.path
      }, r => {
        if(r.info){
          this.info = r.info;
          this.item = this.format(r.info);

          if(this.item.type == 'directory'){
            this.W({
              cmd: 'get',
              path: this.path,
            }, r => {
              $.extend(this.item, r.item);
              cb(this.item);
              k(this.item);
            });
          }
          else{
            cb(this.item);
            k(this.item);
          }
        }
      });
    });
  }

  children(cb){
    this.load(item => {
      this.W({
        cmd: 'fs.list',
        path: this.path
      }, r => {
        var links = [],
            sub = {};

        (r.list || []).forEach(name => {
          let link = sub[name] = new Link_fs(this.protocol +'://'+ this.domain + '/' + this.uri + '/' + name);
          links.push(link);
        });

        if(item && item.children){
          var newLinks = [];
          item.children.forEach(url => {
            var link = (url.indexOf('://')+1)?
              L(url):
              new Link_fs(this.protocol +'://'+ this.domain + '/' + this.uri + '/' + url);

            var indx = r.list.indexOf(url);
            if(indx+1){
              r.list.splice(indx, 1);
              newLinks.push(link);
            }
            else
            if(url.indexOf('://')+1)
              newLinks.push(link);
          });

          (r.list || []).forEach(name => {
            let link = new Link_fs(this.protocol +'://'+ this.domain + '/' + this.uri + '/' + name);
            newLinks.push(link);
          });

          cb(newLinks);
          return;
        }

        cb(links);
      });
    });
  }

  load2Promise(cb){
    return new Promise((ok, no) => {
      this.load(item => {
        item?ok(item):no();
      });
    });
  }
}
