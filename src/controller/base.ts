import { think } from 'thinkjs';
import { lock, ShardDataProxy } from "../common/test";
export default class extends think.Controller {
  async __before(): Promise<boolean> {
    const userInfo = this.ctx.state.userInfo;
    console.log(userInfo);
    if (userInfo) {
      if(userInfo == 1){
        return true;
      }
      const usrid = userInfo.id;
      const proxy: any = await lock(usrid);
      // console.log(proxy);
      if (!proxy) {
        this.fail(4, "data busy");
        return false;
      }
      let lang: string | boolean = this.ctx.acceptsLanguages(["en", "zh_cn"]);
      if (lang === false) {
        lang = "en";
      }
      proxy.language = lang;
      this.ctx.state.proxy = proxy;
      return true;
    }
    this.fail(5, "can not find userid");
    return false;
  }
  async __after() {
    const proxy = this.proxy;
    if (proxy) {
      this.body.data = this.body.data
      await this.proxy.destory();
    }
  }

  get proxy() {
    return this.ctx.state.proxy as ShardDataProxy;
  }
}
