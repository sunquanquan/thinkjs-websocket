import Base from './base.js';
import 'think-websocket';
import {think} from "thinkjs";

const usernames = {};
let numUsers = 0;

export default class extends Base {
  indexAction() {
    return this.display();
  }

  openAction() {
    console.log('获取客户端 opend 事件发送的数据', this.wsData);
    console.log(this.websocket.id);
    this.emit('opend', 'This client opened successfully!')
    this.broadcast('joined', 'There is a new client joined successfully!')
  }

  closeAction() {
    console.log("websocket 关闭");
    if (this.websocket.id) {
      const username = usernames[this.websocket.id];
      delete usernames[this.websocket.id];
      numUsers--;

      this.broadcast('userleft', {
        username: username,
        numUsers: numUsers
      });
    }
  }

  addUserAction() {
    console.log('获取客户端 addUser 事件发送的数据', this.wsData);
    usernames[this.websocket.id] = this.wsData;
    numUsers++;

    this.emit('login', {
      numUsers: numUsers
    });

    this.broadcast('userjoin', {
      username: this.wsData,
      numUsers: numUsers
    });
  }

  chatAction() {
    console.log('获取客户端 chat 事件发送的数据', this.wsData);
    const username = usernames[this.websocket.id];
    this.broadcast('chat', {
      username: username,
      message: this.wsData
    });
  }

  typingAction() {
    const username = usernames[this.websocket.id];
    this.broadcast('typing', {
      username: username
    });
  }
  stoptypingAction() {
    const username = usernames[this.websocket.id];
    this.broadcast('stoptyping', {
      username: username
    });
  }
}

