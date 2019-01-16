export default class Servers{
  constructor(){
      this.list = {};
  }

  connect(host){
    return new Promise((ok, no) => {
      var wsp = this.list[host];
      if(wsp){
        if(wsp instanceof Promise)
          return wsp.then(ws => {
            ok(ws);
          });

        return ok(wsp);
      }

      this.list[host] = new Promise((k, n) => {
        let ws = new WS({
          server: host
          //autoReconnect: true
        });

        ws.on.session = m => {
          this.sid = m.sid;
          this.list[host] = ws;
          ok(ws);
          k(ws)
        };
      });
    });
  }
}
