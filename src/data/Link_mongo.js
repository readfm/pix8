//  mongo://io.cx/pix8#ov2567

export default class Link_mongo{
  constructor(u){
    this.supports = ['mongo'];

    if(typeof u == 'string'){
      if(u.indexOf('://')){
        this.url = this.link = u;

        var [protocol, way] = u.split('://');
        this.protocol = protocol;

        var hash_index = way.indexOf('#');
        if(hash_index + 1){
          this.id = way.substr(hash_index+1);
          way = way.substr(0, hash_index);
        }

        if(way){
          var sep = way.indexOf('/');
          this.domain = this.hash = way.substr(0, sep);
          this.path = way.substr(sep+1);

          this.uri = this.path.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');

        	this.p = this.uri.split(/[\/]+/);

          this.ext = this.path.split('.').pop();
        }

        this.collection = this.p[0];
      }
    }
    else if(typeof u == 'object'){
      $.extend(this, u);
    }

    this.http_files = 'http://f.io.cx/';
    this.http = 'http://'+Cfg.host+':'+Cfg.port+'/'+protocol+'/'+way;
  }

  W(m){
    return new Promise((ok, no) => {
      this.constructor.servers.connect(this.domain).then(ws => ws.send(m, r => ok(r)));
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

  download(){
    return new Promise((ok, no) => {
      ws.download(this.item.file).then(function(data, file){
        ok(data, file);
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

  load(cb){
    var itm = this.item;
    if(itm){
      if(itm instanceof Promise)
        return itm.then(item => cb(item));
      return cb(itm);
    }

    this.item = new Promise((k, n) => {
      this.W({cmd: 'get', filter: {id: this.id}, collection: this.collection}).then(r => {

        this.item = r.item;
        this.http = this.http_files+protocol+'/'+way;

        cb(r.item);
        k(r.item);
      });
    });
  }

  children(cb){
    if(this.filter){
      this.W({
        cmd: 'load',
        filter: this.filter,
        sort: this.sort,
        limit: this.limit,
        collection: this.collection
      }).then(r => {
        var links = [];
        (r.items || []).forEach(item => {
          let link = new Link_mongo(this.protocol +'://'+ this.domain + '/' + this.collection + '#' + item.id);
          link.item = item;
          
          links.push(link);
        });
        cb(links);
      });
    }
    else this.load(item => {
      if(typeof item.children == 'object' && !item.children.length){
        L(item.children).children(cb);
        return;
      }

      var list = item.children || item.items || [];
      var links = [];


  		this.W({
        cmd: 'load',
        filter: {id: {$in: list}},
        collection: this.collection
      }).then(r => {
        var items = {};

        (r.items || []).forEach((item) => {
          items[item.id] = item;
        });

        list.forEach(lnk => {
          let link = (lnk.indexOf('://') + 1)?
            L(lnk):
            new Link_mongo(this.protocol +'://'+ this.domain + '/' + this.collection + '#' + lnk);

          if(link.id && items[link.id])
            link.item = items[link.id];

          links.push(link);
        });
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
