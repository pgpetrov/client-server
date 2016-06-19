"use strict";
class clientHost {
    constructor (payload) {
      payload = payload || {};
      this.name = payload.name;
      this.ip = payload.ip;
      this.room = payload.room;

      this.serverSocket = payload.socket || undefined;
      this.history = payload.history || [];
      this.guests = payload.guests || [];
    }

    broadcast(message) {
      this.history.push(message);
      this.guests.map(x => x.socket.write(message));
    }
}
