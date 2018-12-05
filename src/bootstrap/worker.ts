// invoked in worker
import { think } from "thinkjs";
import * as ThinkGame from "think-game";

think.beforeStartServer(async () => {
    await ThinkGame.world.init();
    ThinkGame.logInfo("Worker start");
})