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
        }

        this.path = way.substr(sep+1);

        this.uri = this.path.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');

      	this.p = this.uri.split(/[\/]+/);

        this.ext = this.path.split('.').pop();

        this.name = this.path.split('/').pop();
      }
    }

    this.collection = this.p[0];

    this.http = 'http://'+this.host+':3000/fs/'+way.replace(/^\/|\/$/g, '').split('/').slice(1).join('/');
    console.log(this.http);
  }

  W(m){
    return new Promise((ok, no) => {
      this.constructor.servers.connect(this.domain + ':' + this.port).then(ws => ws.send(m, r => ok(r)));
    });
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

  download(url){
    return new Promise((ok, no) => {
      this.W({cmd: 'get', link: this.link, url}, r => {
        r.done?ok():no();
      });
    });
  }

  save(item){
    if(!item.id) item.id = this.id;
    return new Promise((ok, no) => {
      this.W({cmd: 'save', item, collection: this.collection}).then(r => {
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
    this.W({
    	cmd: 'fs.info',
    	path: this.path
    }).then(r => {
      if(r.info){
        this.info = r.info;
        this.item = this.format(r.info);
        cb(this.item);
      }
    });
  }

  children(cb){
    this.W({
      cmd: 'fs.list',
      path: this.path
    }).then(r => {
      var links = [];
      (r.list || []).forEach(name => {
        let link = new Link_fs(this.protocol +'://'+ this.domain + '/' + this.uri + '/' + name);
        links.push(link);
      });
      cb(links);
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
