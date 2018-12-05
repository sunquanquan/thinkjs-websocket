import * as path from 'path';
import { think } from 'thinkjs';
const isDev = think.env === 'development';
const auth: any = require("../common/auth");
const cors: any = require("koa-cors2");

module.exports = [
  {
    handle: 'meta',
    options: {
      logRequest: isDev,
      sendResponseTime: isDev
    }
  },
  {
    handle: 'resource',
    enable: isDev,
    options: {
      root: path.join(think.ROOT_PATH, 'www'),
      publicPath: /^\/(static|favicon\.ico)/
    }
  },
  {
    handle: 'trace',
    enable: !think.isCli,
    options: {
      debug: isDev
    }
  },
  {
    handle: 'payload',
    options: {
      keepExtensions: true,
      limit: '5mb'
    }
  },
  {
    handle: 'router',
    options: {}
  },
  {
    handle: cors,
    options: {}
  },
  {
    handle: auth,
    options: {
      ignoreControllers: []
    }
  },
  'logic',
  'controller',
  {
    handle(): Function {
      return (ctx: any, next: any) => {
        return next();
      };
    }
  },
];
