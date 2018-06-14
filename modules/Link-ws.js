window.Link = class Link{
  constructor(url){
    this.url = this.link = url;

    if(url.indexOf('://')){
      var [protocol, way] = url.split('://');
      this.protocol = protocol;

      var sep = way.indexOf('/');
      this.domain = this.hash = way.substr(0, sep);
      this.path = way.substr(sep+1);

      this.ext = this.path.split('.').pop();
    }
  }

  update(set){
    return new Promise((ok, no) => {
      W({cmd: 'update', link: this.link, set}, ok);
    });
  }

  save(item){
    return new Promise((ok, no) => {
      W({cmd: 'save', link: this.link, item}, ok);
    });
  }

  load(cb){
    W({cmd: 'load', link: this.link}, cb);
  }
}
