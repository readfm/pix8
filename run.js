const FS = require('fs');
const JP = require('path').join;
const Electron = require('electron');
const Rre = require('electron');
global._ = require('underscore');

process.chdir(__dirname);

const Read = require('read-data').sync;
const Lines = file => {
  var content = String(FS.readFileSync(file));
  return content.split(/\r?\n/);
}


const Pineal = require('pineal');
_.extend(global, _.pick(Pineal, 'Dats', 'Link', 'Http', 'W', 'API'));
Pineal.init({
//  dats_folder: JP(My_dir, 'dats')
});


global.Cfg = {};

global.App = {
  windows: [],
  openWindow(name){
    conf = _.extend({}, Cfg.windows[name]);

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
  },

  setup(cfg){
    if(cfg.private_dir){
      //Dats.setupFolder(JP(cfg.private_dir, 'dats.log'));
    }

    if(cfg.dats_dir)
      Dats.setupFolder(cfg.dats_dir);

    require('./preload.js');

    _.extend(Cfg, cfg);
  },

  async init(){
    App.setup(Read('./config.yaml'));

    let home_dat = await Dats.open(Cfg.home_dir);
    App.home_link = 'dat://'+home_dat.key.toString('hex')+'/';

    let items_dat = await Dats.open(Cfg.items_dir);
    App.items_link = 'dat://'+items_dat.key.toString('hex')+'/';
  }
};

API.app = (m, q, re) => {
  var r = _.pick(App, 'home_link', 'items_link');
  re(r);
}

App.init();

if(Electron.app){
  Electron.app.on('ready', async () => {
    App.openWindow('index');
  });

    // Quit when all windows are closed.
  Electron.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      Electron.app.quit()
    }
  });
}
