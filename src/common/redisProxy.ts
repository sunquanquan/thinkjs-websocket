import * as Redis from 'ioredis';
import { think } from 'thinkjs';
import * as helper from 'think-helper';
import { MessageInfo, RoomMember, RedisMessageInfo } from "../protocol/SharedStruct";
import { EChatChannel } from '../protocol/SharedEnum';

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

/** 玩家数据操作代理类 */
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

export async function lock(usrid: number, expireTime: number = 20) {
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

// 创建房间
export async function createRoom(channel: number, sender: number, recipient: number, newMember: RoomMember[]) {
    const roomId: number = await this.getNewRoomId(channel);

    await redis().hset(`chat:${channel}:${roomId}:member`, "createRoom" + roomId, JSON.stringify(newMember));

    const channelKey: string = `chat:${channel}:roomInfo`;
    await redis().lpush(channelKey, roomId);

    const channelRoomKey: string = `chat:${sender}:private:roomId`;
    await redis().lpush(channelRoomKey, roomId);

    const channel1: string = `chat:${recipient}:private:roomId`;
    await redis().lpush(channel1, roomId);
}

// 创建最新房间id
export async function getNewRoomId(channel: number) {
    // 聊天室id自增
    const roomId: number = await redis().incr(`chat:${channel}:roomId`);
    return roomId;
}

// 获取房间id
export async function getRoomIds(userId: number, channel: number): Promise<number[]> {
    const roomIdKey: string = `chat:${userId}:${channel}:roomId`;
    const roomIdList: number[] = await redis().lrange(roomIdKey, 0, -1);
    return roomIdList;
}

// 获取房间成员
export async function getRoomMember(channel: number, roomId: number) {
    const cmKey: string = `chat:${channel}:${roomId}:member`;
    const cmListStr: string = await redis().hget(cmKey, "createRoom" + roomId);
    let cmList: RoomMember[] = [];
    if (cmListStr) {
        cmList = JSON.parse(cmListStr);
    }
    return cmList;
}

// 获取房间信息
export async function getRoomMessage(channel: number, roomId: number) {
    const cMsgKey: string = `chat:${channel}:${roomId}:message`;
    const cMsgListStr: string[] = await redis().lrange(cMsgKey, 0, -1);
    const cMsgList: any = [];
    for (let message of cMsgListStr) {
        cMsgList.push(JSON.parse(message));
    }
    return cMsgList;
}

// 获取最新msgId
export async function getMessageId(channel: number, roomId: number) {
    const cmKey: string = `chat:${channel}:${roomId}:messageId`;
    const cmListStr: string = await redis().get(cmKey);
    return cmListStr;
}

// 未读消息的数量
export async function unreadNum(channel: number, roomId: number, userId: number): Promise<[number, MessageInfo]> {
    let newMessage: MessageInfo = new MessageInfo();
    let lastRead: number = 0;
    const memberTmp: RoomMember[] = await this.getRoomMember(channel, roomId);

    const memberIdArr: number[] = [];
    for (let readInfo of memberTmp) {
        memberIdArr.push(readInfo.member);
        if (readInfo.member == userId) {
            lastRead = readInfo.lastRead
        }
    }

    let newRead: number = 0;
    const messageTmp: MessageInfo[] = await this.getRoomMessage(channel, roomId);
    for (let messageKey in messageTmp) {
        let msg = messageTmp[messageKey];
        if (msg.messageId >= lastRead && newRead < msg.messageId) {
            newRead = msg.messageId;
            newMessage.message = msg.message;
            newMessage.messageId = msg.messageId;
            newMessage.time = msg.time;
            newMessage.userId = msg.userId;
            if (memberIdArr.indexOf(msg.userId) >= 0) {
                const index = memberIdArr.indexOf(msg.userId);
                newMessage.name = memberTmp[index].name;
                newMessage.portrait = memberTmp[index].portrait;
                newMessage.sex = memberTmp[index].sex;
            }
        }
    }

    return [newRead - lastRead, newMessage]
}

// 获取世界信息
export async function getWorldMessage() {
    const cMsgKey: string = `chat:${EChatChannel.world}:userMessage`;
    const cMsgListStr: string[] = await redis().lrange(cMsgKey, 0, -1);
    const cMsgList: any = [];
    for (let message of cMsgListStr) {
        cMsgList.push(JSON.parse(message));
    }
    return cMsgList;
}
