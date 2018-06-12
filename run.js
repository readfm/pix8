const FS = require('fs');
const JP = require('path').join;
const Electron = require('electron');
const Rre = require('electron');
global._ = require('underscore');

const Read = require('read-data').sync;
const Lines = file => {
  var content = String(FS.readFileSync(file));
  return content.split(/\r?\n/);
}



global.My_dir = FS.readFileSync('./my_dir.txt');

const Pineal = require('pineal');
_.extend(global, _.pick(Pineal, 'Dats', 'Link', 'Http', 'W'));
Pineal.init({
  dats_folder: JP(My_dir, 'dats')
});


global.Pref = Read(JP(My_dir, 'pref.yaml'));
Dats.load(Lines(JP(My_dir, 'dats.log')));



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
