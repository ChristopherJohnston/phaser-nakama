// import NakamaPlugin from './NakamaPlugin';
// import { DefaultSocket, MatchPresenceEvent } from '@heroiclabs/nakama-js/dist/socket';
// import { Session } from '@heroiclabs/nakama-js';

// class Match {
//     plugin: NakamaPlugin;
//     matchId?: string;
//     connectedOpponents: Array<string>;
//     private _socket?: DefaultSocket;
//     socketSession?: Session;

//     constructor(plugin, matchId? : string) {
//         this.plugin = plugin;
//         this.matchId = matchId;
//         this.connectedOpponents = [];
//     }

//     get socket(): DefaultSocket {
//         if (this._socket === undefined) {
//             this._socket = <DefaultSocket>this.plugin.client.createSocket(false);
//         }
//         return this._socket!
//     }

//     async connectSocket() {
//         try {
//             this.socketSession = await this.socket!.connect(this.plugin.session, true);
//             console.info(`Socket Connected in Match ${this.matchId}`, this.socketSession);

//             this.socket!.ondisconnect = (evt) => {
//                 console.info(`Socket Disconnected In Match ${this.matchId}`, evt);
//             }
//         } catch (error) {
//             console.error(`Error connecting to socket in Match ${this.matchId}`, error);
//         }
//     }

//     disconnectSocket() {
//         this.socket!.disconnect();
//         this._socket = undefined
//     }

//     // Match
//     async create() {
//         await this.connectSocket();
//         var response = await this.socket!.send( { match_create: {}});
//         console.info(`Created Match with ID: ${response.match.match_id}`, response);
//         this.matchId = response.match.match_id;
//         this.subscribeMatchPresence();
//         this._join();
//     }

//     async _join() {
//         var { match } = await this.socket!.send({ match_join: { match_id: this.matchId! } });
//         this.connectedOpponents = match.presences.filter((presence) => {
//             // Remove your own user from list.
//             return presence.user_id != match.self.user_id;
//         });
//         this.connectedOpponents.forEach((opponent) => {
//             console.log("User id %o, username %o.", opponent.user_id, opponent.username);
//         });
//         this.subscribeMatchPresence();
//     }

//     async join() {
//         await this.connectSocket();
//         this._join();
//     }

//     async leave() {
//         console.info("Leaving Match");
//         const res = await this.socket!.send({ match_leave: { match_id: this.matchId! }});
//         this.disconnectSocket();
//         return res;
//     }

//     subscribeMatchPresence() {
//         this.socket!.onmatchpresence = (presences: MatchPresenceEvent) => {
//             // Remove all users who left.
//             if (presences.leaves) {
//                 this.connectedOpponents = this.connectedOpponents.filter((connectedOpponent: {}) => {
//                     var stillConnectedOpponent = true;
//                     presences.leaves.forEach((leftOpponent: {}) => {
//                         if (leftOpponent.user_id == connectedOpponent.user_id) {
//                             stillConnectedOpponent = false;
//                         }
//                     });
//                     return stillConnectedOpponent;
//                 });
//             }
        
//             // Add all users who joined.
//             if (presences.joins) {
//                 this.connectedOpponents = this.connectedOpponents.concat(presences.joins);
//             }
//             console.info(`Match Users Updated`, this.connectedOpponents);
//         };
//     }

//     subscribeMatchData() {
//         this.socket!.onmatchdata = (matchData) => {
//             const { op_code, data } = matchData;
//             console.info(`Match Data Received: OpCode=${op_code}, Data=${data}`);
//         }
//     }

//     sendData(opCode, data) {
//         // var opCode = 1;
//         // var data = { "move": {"dir": "left", "steps": 4} };
//         this.socket!.send({ match_data_send: { match_id: this.matchId!, op_code: opCode, data: data, presence: [{}] } });
//     }
// }

// export default Match;