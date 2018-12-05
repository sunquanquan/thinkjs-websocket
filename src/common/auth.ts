import * as Koa from 'koa';
import { think } from 'thinkjs';
import * as path from 'path';
import { ErrorCode, world } from 'think-game';
import * as jwt from 'jsonwebtoken';
import * as ThinkGameExtend from 'think-game-extend';
import { AccountSystem, accountSystem } from 'think-game/lib/game-world/modules/account/AccountSystem';
import * as ThinkHelper from 'think-helper';
const defaultOptions = {
    ignoreControllers: ["account", "gm"],
    strict: true
}
/**
 * authentication middleware
 * @param options Configurations
 * @param app Koa application
 */
function authenticate(options: any, app: Koa) {
    const opts = think.extend({}, defaultOptions, options)
    return async (ctx: any, next: any) => {
        const controller = new think.Controller(<any>ctx);
        // Only allow post method
        if (ctx.request.method != 'WEBSOCKET') {
            if (!ctx.isPost) {
                return controller.$fail(ErrorCode.ERROR_METHOD_NOT_ALLOWED);
            }
            const postData = (<any>ctx.request).body ? (<any>ctx.request).body.post : undefined;
            if (!postData) {
                return controller.$fail(ErrorCode.ERROR_BAD_REQUEST);
            }
            const controllerWhiteList: Array<string> = ThinkHelper.isEmpty(options.ignoreControllers) ? ["account", "gm"] : options.ignoreControllers;
            const controllers = controllerWhiteList.filter((value: string, index: number, array: string[]) => {
                return (ctx.controller as string).startsWith(value);
            });
            const needAuth = controllers.length == 0;
            console.log(needAuth)
            if (needAuth && ThinkHelper.isEmpty(postData.jwt)) {
                return controller.$fail(ErrorCode.ERROR_BAD_REQUEST);
            }
            const data = ThinkHelper.isEmpty(postData.jwt) ? {} : jwt.verify(postData.jwt, world.publicKey);
            if (needAuth && !ThinkHelper.isObject(data)) {
                return controller.$fail(ErrorCode.ERROR_UNAUTHORIZED);
            }
            // if (needAuth && opts.strict) {
            //     console.log("+++++++++")
            //     console.log(data)
            //     const res = await accountSystem.verifySession(data);
            //     if (!res) {
            //         return controller.$fail(ErrorCode.ERROR_UNAUTHORIZED);
            //     }
            // }
            ctx.state.userInfo = data;
            return next();
        } else {
            ctx.state.userInfo = 1;
            return next();
        }
    };


    // return (ctx: Koa.Context, next: any) => {
    //     const controller = new think.Controller(<any>ctx);
    //     const postData = (<any>ctx.request).body ? (<any>ctx.request).body.post : undefined;
    //     if (!postData) {
    //         return;
    //     }
    //     ctx.state.userId = postData.data.userId;
    //     return next();
    // };
}

export = authenticate;
