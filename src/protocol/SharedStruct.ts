/**
 *  MADE BY GENERATOR AT 2018-11-30 10:22:23,
 *  PLEASE DO NOT REWRITE.
 */

import * as SE from "./SharedEnum";

export class NewMessageInfo { 
    num: number = 0; // 未读消息的数量
    type: string = ""; // 消息类型，user/system
    userMsg: MessageInfo | null = null; // 最新一条未读消息
    systemMsg: SystemMessage | null = null; // 系统消息
}

export class RedisMessageInfo { 
    userId: number = 0; // 玩家id
    messageId: number = 0; // 信息id
    message: string = ""; // 信息
    time: number = 0; // 发送时间
}

export class MessageInfo { 
    userId: number = 0; // 玩家id
    name: string = ""; // 公司名
    portrait: number = 0; // 头像
    sex: number = 0; // 性别
    messageId: number = 0; // 信息id
    message: string = ""; // 信息
    time: number = 0; // 发送时间
}

export class SystemMessage { 
    userId: number = 0; // 玩家id
    messageId: number = 0; // 信息id // 世界频道的消息id
    message: number = 0; // 信息id //MsgChat表
    time: number = 0; // 发送时间
    fieldInfo: Array<FieldInfo> | null = null; // 信息详情
}

export class FieldInfo { 
    type: number = 0; 
    text: string = ""; 
    args: string = ""; 
}

export class PrivateListInfo { 
    roomId: number = 0; // 房间号
    userId: number = 0; // 玩家id
    name: string = ""; // 公司名
    portrait: number = 0; // 头像
    sex: number = 0; // 性别
    message: MessageInfo | null = null; // 信息
    newMsgNum: number = 0; // 新消息的数量
}

export class PushMessageInfo { 
    roomId: number = 0; // 房间号
    message: Array<MessageInfo> | null = null; // 信息
}

export class RoomMember { 
    member: number = 0; // 成员id
    name: string = ""; // 公司名
    portrait: number = 0; // 头像
    sex: number = 0; // 性别
    lastRead: number = 0; // 上一次阅读的消息id
}



