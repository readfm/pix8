# pix8: better pictures faster
[![npm version](https://badge.fury.io/js/apollo-client.svg)](https://badge.fury.io/js/apollo-client) [![Get on Slack](https://img.shields.io/badge/slack-join-orange.svg)](http://www.apollostack.com/#slack) [![Open Source Helpers](https://www.codetriage.com/apollographql/apollo-client/badges/users.svg)](https://www.codetriage.com/apollographql/apollo-client)

## About
Package can be openned in three different environments
chrome extension - go to chrome://extensions/ , mark "Developer mode" , click 'Load unpacked' and link this folder
electron app - just open electron/pix8.exe and you will see it running in your task bar
web app - click on run.cmd and open it in browser http://m/word


## Install
Before installing make sure you have, electron, git, https://datproject.org and https://nodejs.org/en/ installed.
To be able to edit visual data https://www.ffmpeg.org/download.html is recomended
Once you got git cloned, open that folder and run npm installer to get all the rest dependencies
    git clone https://github.com/readfm/pix8.git # or your own fork on Github
    cd pix8
    npm install
    
once its done, etract ffmpeg bin folder and make sure you link ffmpeg bin's correctly in config.yaml file
    
## System structure
It's recomended to keep required folders along with pix8. But all defaults can be changed in config.yaml
By default configuration data will be taken from config.yaml file and can be extended by ../config.yaml (if the one was created)

## Data model
System is using jQuery like way of interacting with source, within new Link(url) can be passed path of supported data format
For now we are using DAT to manage data, later it can be extended by IPFS and NDN 

## Configuration
Right now we dont have setup environment to do installation and configuration steps within simple UI,
but if you preffer edit yourself, open config.yaml

    port: 80 #default port to access WEB version
    storage:
      home: 'C:\8\me'           # public location of where to store your personal data
      private: 'C:\8\private'   # folder with an imformation that cant be shared with anybody
      items: 'C:\8\items'       # where we store initial DAT elements
      dats: 'C:\8\dats'         # default spot where to store external dat packages
      wiki: 'C:\8\wiki'         # refactored wiki html pages
      youtubes: 'C:\8\youtubes' # downloaded youtube videos, before it gets converted
    ggif_app: 'C:\8\ggif'       # leave empty if you dont need https://github.com/readfm/ggif

    ffmpeg: '../bin/ffmpeg.exe'     #path of video codecs
    ffprobe: '../bin/ffprobe.exe'   # from https://www.ffmpeg.org/download.html

next edit C:\Windows\System32\drivers\etc\hosts with admin permissions and add
    127.0.0.1	  pix8.lh preload.lh 8 m m8

## System Requirements
pi8 can run on most Linux, macOS, and Windows systems. We recommend running it on a machine with at least 2 GB of RAM .

## status:
out of control, ready for fork/management upgrade
thanks for your patience
get updates, send complaints @dukecrawford

## demo 1
* http://th.ai vocal visual wiki experiment eg
* th.ai/vocal
* th.ai/visual
* th.ai/wiki more vocal visual wiki
  
## demo 2
  a) tiny.cc/pix8
  b) 1 minute video, watch it
  c) try extension, pix8 any webpage you like
  
## code questions
Mantas Kazlauskas mntask@gmail.com @mntask

## v3 is below
DAT http://datproject.org powered user owned data
hash validation (immutable data you can trust)
fast local memory (less server dependency)

v2 readme

Pictures are good. How make better?

* TAG find pix fast like spoken words 
* SORT good pix up, ok pix down
* WEB put any pix you like w/ any page you like tiny.cc/pix8
* WIKI sync words in wiki with pix http://th.ai
* SOUND, put audio in, switch audio, sort audios for any pic ggif.co kinda
* MEMORY own, sign, date, transact
* SOCIAL see who sees what how
* SUPERDISTRIBUTION see Brad Cox

==

pix8 Modules:
carousel.js - prototype for creating carousel objects, that later can be inserted anywhere, (by default goes with pix object)
carousel.css - styles and arrangment to make carousels work correctly with js module

pix.js - main pix8 module, controls all carousels

pix8list - will menu item to the left top corner and will open that list on click with couple main filters included (hot, new).


GG.js & GG.css - game module, uses 'scores' collection, gif library must be included

run.js - if loaded within web app like io.cx, this module will connnect all parts and iintegrate them within website

local.js - to manage files data within localhost, (needs to be update to work with all)

integrate.js - will integrate pix8 into website, like wikipedia..

background.js - chrome extension always on background script, listens to click events and inserts scripts into current website

Data is taken from Cfg.collection , by filtering only those elements that was watson synched with yid(youtube id) field. To make this module work, Catalog.js lib should be included

io.cx modules: 

builder.js - builds each element that you can use within pix8 apps
device.js - special for phonegap app
ggame.js - people can do tap tap within io.cx editor
ggif.js - gif compiler, includes sound, connects frames, adds data attributes, uploads and downloads images from server..
impose.js - makes text go over youtube content
textdata.js - list of elements below youtube
tx.j - controls text conntent, makes it possible to edit watson results, etc.
watson.js - connects to watson and receives transcribed text from audio.
wysiwyg.js - makes watson result block editable

libraries
download.js - makes it possible to download image from canvas
draggable.js - makes it possible to sort and move around elements
gif.js - reads ggif
functions.js - collection of all small extra functions for web app
jquery.event.drag.js - makes it possible to drag blocks around
jquery.event.drop.js - makes it possible to move elements on another ones and take certain action
omggif.js - gif reader and compiler
