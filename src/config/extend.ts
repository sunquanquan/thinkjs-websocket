const view = require('think-view');
const model = require('think-model');
const cache = require('think-cache');
const session = require('think-session');
const websocket = require('think-websocket');
const gameCache: any = require("think-game-cache");
import { think } from 'thinkjs';

module.exports = [
  view, // make application support view
  model(think.app),
  cache,
  session,
  websocket(think.app),
  gameCache
];
