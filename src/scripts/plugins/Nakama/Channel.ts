// import { NakamaPlugin } from ".";
// import { DefaultSocket, ChannelMessage, ChannelPresenceEvent } from "@heroiclabs/nakama-js/dist/socket";
// import { Session, ChannelMessageList } from "@heroiclabs/nakama-js";

// enum ChannelType {
//     Public = 1,
//     Group = 2,
//     Direct = 3
// }

// enum MessageCodes {
//     ChatMessage = 0,
//     ChatUpdate = 1,
//     ChatRemove = 2,
//     JoinedGroup = 3,
//     AddedToGroup = 4,
//     LeftGroup = 5,
//     KickedFromGroup = 6,
//     PromotedInGroup = 7
// }

// class Channel {
//     plugin: NakamaPlugin;
//     type: ChannelType;
//     target: string;
//     channelId?: string;
//     private _socket?: DefaultSocket;
//     socketSession?: Session;

//     constructor(plugin: NakamaPlugin, type: ChannelType, target: string) {
//         this.plugin = plugin;
//         this.type = type;
//         this.target = target;
//     }

//     get socket(): DefaultSocket {
//         if (this._socket === undefined) {
//             this._socket = <DefaultSocket>this.plugin.client.createSocket(false);
//         }
//         return this._socket!
//     }

//     async connectSocket() {
//         try {
//             this.socketSession = await this.socket.connect(this.plugin.session, true);
//             console.info(`Socket Connected in Group ${this.target}`, this.socketSession);

//             this.socket!.ondisconnect = (evt) => {
//                 console.info(`Socket Disconnected In Group ${this.target}`, evt);
//             }
//         } catch (error) {
//             console.error(`Error connecting to socket in Group ${this.target}`, error);
//         }
//     }

//     async disconnectSocket() {
//         this.socket.disconnect();
//         this._socket = undefined;
//     }

//     // Chat
//     // async connect() {
//     //     await this.connectSocket();

//     //     const response = await this.socket.send({ channel_join: {
//     //         type: this.type,
//     //         target: this.target,
//     //         persistence: true,
//     //         hidden: false
//     //     }});
//     //     this.channelId = response.channel.id;
//     //     console.log("You can now send messages to channel id: ", response.channel.id);

//     //     this.socket.onchannelmessage = this.onChannelMessage.bind(this);
//     //     this.socket.onchannelpresence = this.onChannelPresence.bind(this);
//     // }

//     onChannelMessage(msg: ChannelMessage) {
//         if (msg.channel_id === this.channelId) {
//             console.info(`Group Message Received in Group ${this.target}`, msg);
//         }        
//     }

//     onChannelPresence(event: ChannelPresenceEvent) {
//         if (event.channel_id === this.channelId) {
//             console.info(`Group Presence Received in Group ${this.target}`, event);
//         }
//     }

//     async disconnect() : Promise<{}> {
//         const res = await this.socket.send({ channel_leave: {
//             channel_id: this.channelId!
//           } });
//         this.channelId = undefined;

//         this.disconnectSocket();
//         return res;
//     }

//     async getMessageHistory() : Promise<ChannelMessageList> {
//         const result = await this.plugin.client.listChannelMessages(this.plugin.session, this.channelId!, 10);
//         return result;
//     }

//     async sendMessage(msg: ChannelMessage) {
//         if (this.channelId === undefined) {
//             console.error("User hasn't joined channel");
//             return;
//         }

//         const ack = await this.socket.send({ channel_message_send: {
//             channel_id: this.channelId!,
//             content: { message: msg }
//         }})
//     }
// }

// export { Channel, ChannelType, MessageCodes };