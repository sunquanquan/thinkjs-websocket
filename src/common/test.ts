import { request } from "http";
import { parse } from "url";
import * as Redis from 'ioredis';
import { think } from 'thinkjs';
import * as helper from 'think-helper';

/** 全局数据操作代理类 */
export class GlobalDataProxy {
    unlockKey: string;
    constructor(unlockKey: string) {
        this.unlockKey = unlockKey;
    }
    async destory() {
        await unlockGlobal(this.unlockKey);
    }
}
/**
 * 全局数据获取锁
 * @param expireTime 
 */
export async function lockGlobal(expireTime: number = 20) {
    const redisKey = makeGlobalLockKey();
    const uuid = helper.uuid("v1");
    const ret = await redis().set(redisKey, uuid, 'EX', expireTime, 'NX');
    if (ret !== 'OK') {
        return undefined;
    }
    return new GlobalDataProxy(uuid);
}

/**
 * 全局数据多次试图获取锁
 * @param count 
 * @param interval 
 */
export async function trylockGlobal(count = 10, interval = 200) {
    for (let i = 0; i < count; i++) {
        const proxy = lockGlobal();
        if (proxy) {
            return proxy;
        }
        await sleep(interval);
    }
    return undefined;
}

/**
 * 全局数据释放锁
 * @param unlockKey 
 */
export async function unlockGlobal(unlockKey: string) {
    const redisKey = makeGlobalLockKey();
    const ret = await (redis() as any).unlock(redisKey, unlockKey);
    return true;
}

export class ShardDataProxy {
    userId: number;
    unlockKey: string;

    /**
     * 务必使用lock 或者 trylock获取对象
     * @param usrid 玩家id通过这个对象操作玩家数据务必
     */
    constructor(userId: number, unlockKey: string) {
        this.userId = userId;
        this.unlockKey = unlockKey;
    }

    /**
     * 刷新内存过期时间 长期不登录的用户 数据将被踢出内存
     * @param key 
     * @param seconds 过期时间，默认为72小时
     */
    async refreshExpiredTime(key: string, seconds = 60 * 60 * 72) {
        await redis().expire(key, seconds);
    }


    async destory() {
        await unlock(this.userId, this.unlockKey);
    }
}


let redisInit = false;
function redis() {
    const redis = think.getRedisClient() as Redis.Redis;
    if (!redisInit) {
        redisInit = true;
        redis.defineCommand('unlock', {
            numberOfKeys: 1,
            lua: 'if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end'
        });
    }
    return redis;
}

function makeGlobalLockKey() {
    return 'chat:user:gloabLock';
}
function makeUsrLockKey(usrid: number) {
    return `chat:user:lock:${usrid}`;
}
function sleep(time: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
export async function lock(usrid: number, expireTime: number = 2000) {
    const redisKey = makeUsrLockKey(usrid);
    const uuid = helper.uuid("v1");
    const ret = await redis().set(redisKey, uuid, 'EX', expireTime, 'NX');
    if (ret !== 'OK') {
        return undefined;
    }
    return new ShardDataProxy(usrid, uuid);
}
/**
 * 多次尝试获取玩家数据锁
 * @param usrid 玩家id
 * @param count 尝试次数
 * @param interval 尝试间隔 单位是毫秒
 */
export async function trylock(usrid: number, count = 10, interval = 200) {
    for (let i = 0; i < count; i++) {
        const proxy = lock(usrid);
        if (proxy) {
            return proxy;
        }
        await sleep(interval);
    }
    return undefined;
}

/**
 * 释放玩家数据锁
 * @param usrid 玩家id
 */
export async function unlock(usrid: number, unlockKey: string) {
    const redisKey = makeUsrLockKey(usrid);
    const ret = await (redis() as any).unlock(redisKey, unlockKey);
    return true;
}

/**
 * 在这里放置通用的工具函数
 */

// todo
export function MapToArray<T>(map: Map<any, T>) {
    const array = new Array<T>();
    for (let obj of map.values()) {
        array.push(obj);
    }
    return array;
}

export function UnixTimeToDate(unixTime: number) {
    return new Date(unixTime * 1000);
}

export function DateToUnixTime(date: Date) {
    return parseInt((date.getTime() / 1000).toString());
}

export function GetUnixNow() {
    return DateToUnixTime(new Date());
}

export function GetTimeStr(time: Date) {
    return `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`;
}

export function GetUtcTimeStr(time: Date) {
    return `${time.toDateString()} ${time.toTimeString()}`;
}


export async function DoRequest(url: string, reqDate: any) {
    const postData = JSON.stringify(reqDate);
    const urlObj = parse(url);
    const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resove, reject) => {
        const req = request(options, (res) => {
            res.setEncoding('utf8');
            let buffer: Buffer;
            res.on('data', (chunk: Buffer) => {
                if (buffer) buffer = Buffer.concat([buffer, chunk], 2);
                else buffer = chunk;
            });
            res.on('end', () => {
                try {
                    resove(JSON.parse(buffer.toString()));
                }
                catch (e) {
                    resove(buffer.toString());
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.setTimeout(5000, () => {
            reject(new Error('request time out'));
        });

        req.write(postData);
        req.end();
    });
}
