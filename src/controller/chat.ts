import { chat } from "../protocol/API";
import { ChatSystem } from "../game-world/ChatSystem";
import Base from './base';
import {think} from "thinkjs";

export default class Controller extends Base {
    /**
     * 屏蔽
     */
    async SheieldingAction() {
        console.log("sheild................");
        const reqData = <chat.SheieldingRequest>(<any>this.post()).data;
        const resData = new chat.SheieldingResponse();

        await ChatSystem.instance.shielding(this.proxy.userId, reqData.userId);

        this.success(resData);
    }
}