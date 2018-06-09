const FS = require('fs');
const JP = require('path').join;
const Electron = require('electron');
global._ = require('underscore');


var App = {
  windows: [],
  openWindow: function(name){
    conf = _.extend({}, this.cfg.windows[name]);
    console.log(conf);

    var allignPath = file => JP(__dirname, file);
    if(conf.BrowserWindow.icon)
      conf.BrowserWindow.icon = allignPath(conf.BrowserWindow.icon);

    let win = this.windows[name] = new Electron.BrowserWindow(conf.BrowserWindow);
    //const index = this.windows.push(win) - 1;

    var path = allignPath(conf.file || 'index.html');
    console.log(path);
    if(conf.url){
      if(conf.url.params)
        path += '?' + querysrequire('querystring').stringify(conf.url.params);
    }

    win.loadURL(path);

    if(conf.maximize)
      win.maximize();

    if(conf.openDevTools)
      win.webContents.openDevTools();

    win.setMenu(null);
    win.on('closed', ev => {
      win = this.windows[name] = null;
    });
  }
};

Electron.app.on('ready', () => {
  App.cfg = require('./app.json');
  App.openWindow('index');
});
