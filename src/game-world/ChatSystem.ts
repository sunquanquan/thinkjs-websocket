import { think } from "thinkjs";
import { Redis } from "ioredis";

export class ChatSystem {
    private static instance_: ChatSystem;
    private redis: Redis;

    private constructor() {
        this.redis = think.getRedisClient();
    }

    public static get instance(): ChatSystem {
        if (!ChatSystem.instance_) {
            ChatSystem.instance_ = new ChatSystem();
        }
        return ChatSystem.instance_;
    }
    // 屏蔽
    async shielding(userId1: number, userId2: number): Promise<void> {
        const shieldKey: string = `chat:${userId1}:shield:userId`;
        await this.redis.zadd(shieldKey, "", userId2.toString());
        return;
    }
}