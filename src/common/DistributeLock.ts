import { think } from 'thinkjs';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

/**
 * 简单的分布式锁
 */
export class DistributeLock {
    private lockKey: string;
    private lockValue: string;
    private lockDuration: number;
    static defaultLockDuration: number = 10000;
    /**
     * 构造函数
     * @param key key
     * @param duration 持续时间 
     */
    constructor(key: string, duration: number = DistributeLock.defaultLockDuration) {
        this.lockKey = key;
        this.lockValue = undefined;
        this.lockDuration = duration;
    }
    /**
     * 获取锁
     * @param key key
     * @param duration 持续时间 
     */
    private static async acquireLock(key: string, duration: number = DistributeLock.defaultLockDuration) {
        const redis = think.getRedisClient();
        let result = await redis.get(key);
        if (result) {
            // 其它进程占有锁
            return undefined;
        }
        // 加锁
        await redis.watch(key);
        const value = think.uuid();
        const res = await redis.multi().psetex(key, duration, value).exec();
        if (think.isArray(res)
        && res.length > 0
        && think.isArray(res[0])
        && res[0].length >= 2
        && res[0][1] == 'OK'){
            //如果执行成功
            return value;
        }
        return undefined;
    }
    /**
     * 释放锁
     * @param key key 
     * @param value value
     */
    private static async releaseLock(key: string, value: string) {
        const redis = think.getRedisClient();
        if (value) {
            await redis.watch(key);
            const storedValue = await redis.get(key);
            if (value === storedValue) {
                const res = await redis.multi().del(key).exec();
                if (think.isArray(res)
                && res.length > 0
                && think.isArray(res[0])
                && res[0].length >= 2
                && res[0][1] == 'OK'){
                    //如果执行成功
                    return true;
                }
                redis.unwatch();
            }
        } else {
            await redis.del(key);   // 删除即可
            return true;
        }
        return false;
    }
    /**
     * 加锁
     * @param key key
     * @param duration 持续时间
     */
    static async lock(key: string, duration: number = DistributeLock.defaultLockDuration) {
        let now: number = new Date().getTime();
        let deadline: number = now + duration * 3 + 1;  //  在3个cycle内仍未抢到锁就返回
        let result: string = undefined;
        while (now < deadline) {
            result = await DistributeLock.acquireLock(key, duration);
            if (result) {
                break
            }
            await sleep(1);
            now = new Date().getTime();
        }
        return result;
    }
    /**
     * 解锁实现
     * @param key key
     */
    static async unlock(key: string, value: string = undefined) {
        return DistributeLock.releaseLock(key, value);
    }
    /**
     * 加锁
     * @param key key
     * @param duration 持续时间
     */
    async lock() {
        this.lockValue = await DistributeLock.lock(this.lockKey, this.lockDuration);
        return this.lockValue !== undefined;
    }
    /**
     * 解锁
     * @param key key
     */
    async unlock() {
        return await DistributeLock.unlock(this.lockKey, this.lockValue);
    }
}