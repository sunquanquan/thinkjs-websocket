/**
 * 错误码定义
 */

export class GameErrorCode {
    public static readonly ERROR_DATA_BUSY: [number,string] = [4,"ERROR_DATA_BUSY"];// 数据繁忙
    // chat
    public static readonly ERROR_OK: [number,string] = [0,"ERROR_OK"]; //
    public static readonly ERROR_ROOM_NO_EXIST: [number,string] = [5601,"ERROR_ROOM_NO_EXIST"];// 房间不存在
    public static readonly ERROR_BEFORE_CD_TIME: [number,string] = [5602,"ERROR_BEFORE_CD_TIME"];// 未到cd时间
    public static readonly ERROR_NO_SEND_YOURSELF: [number,string] = [5603,"ERROR_NO_SEND_YOURSELF"];// 不能发送给自己
    public static readonly ERROR_RECIPIENT_IS_SHEILD: [number,string] = [5604,"ERROR_RECIPIENT_IS_SHEILD"];// 接受者已被屏蔽
}