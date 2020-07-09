import * as NakamaApi from '@heroiclabs/nakama-js';
import Phaser from 'phaser';
import NakamaSockets from '@heroiclabs/nakama-js/dist/socket';
// import Match from './Match';
import { Authentication } from './Authentication';
import { Group } from '.';

enum NotificationCodes {
    RESERVED = 0, // 0: Reserved
    CHAT_REQUEST = -1, // user x wants to chat
    FRIEND_REQUEST = -2, // user x wants to add you as a friend
    FRIEND_ACCEPT = -3, // user x accepted your invite
    GROUP_JOIN_ACCEPT = -4, // accepted to group x
    GROUP_JOIN_REQUEST = -5, // user x wants to join your group
    FRIEND_JOINED_GAME = -6 // your friend x joined the game
}

enum FriendStates {
    FRIEND = 0,
    INVITE_SENT = 1,
    INVITE_RECEIVED = 2,
    BLOCKED = 3
}

enum NakamaPluginEvents {
    SOCKET_CONNECTED = 'NAKAMA_SOCKET_CONNECTED',
    SOCKET_ERROR = 'NAKAMA_SOCKET_ERROR',
    STREAM_PRESENCE = 'NAKAMA_STREAM_PRESENCE',
    STREAM_DATA = 'NAKAMA_STREAM_DATA',
    STATUS_PRESENCE = 'NAKAMA_STATUS_PRESENCE',
    NOTIFICATION = 'NAKAMA_NOTIFICATION',
    FRIENDS_ADDED = 'NAKAMA_FRIENDS_ADDED',
    FRIENDS_BLOCKED = 'NAKAMA_FRIENDS_BLOCKED',
    FRIENDS_REMOVED = 'NAKAMA_FRIENDS_REMOVED',
    GROUP_JOINED = 'NAKAMA_GROUP_JOINED',
    GROUP_CREATED = 'NAKAMA_GROUP_CREATED',
    GROUP_LEFT = 'NAKAMA_GROUP_LEFT',
    GROUP_DELETED = 'NAKAMA_GROUP_DELETED',
    MATCH_JOINED = 'NAKAMA_MATCH_JOINED',
    MATCH_CREATED = 'NAKAMA_MATCH_CREATED'
}

class NakamaPlugin extends Phaser.Plugins.BasePlugin {
    client: NakamaApi.Client;
    authentication: Authentication;
    session: NakamaApi.Session;
    _socket?: NakamaSockets.DefaultSocket;
    socketSession?: NakamaApi.Session;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
    }

    init() {
        this.client = new NakamaApi.Client("defaultkey", "127.0.0.1", "7350");
        this.client.useSSL = false;
        this.authentication = new Authentication(this);
    }

    // Sockets
    get socket() : NakamaSockets.DefaultSocket {
        if (this._socket === undefined) {
            this._socket = <NakamaSockets.DefaultSocket>this.client.createSocket(false);
        }
        return this._socket!;
    }

    async connectSocket() {
        try {
            this.socketSession = await this.socket.connect(this.session, true);
            console.info('Socket Connected', this.socketSession);

            this.socket.ondisconnect = (evt) => {
                console.info('Socket Disconnected', evt);
            }

            this.socket.onerror = (err) => {
                console.error('Error in socket', err);
            }

            this.socket.onstreampresence = (msg) => {
                console.info(`Stream Presence Message`, msg);
            }

            this.socket.onstreamdata = (msg) => {
                console.info(`Stream Data Message`, msg);
            }

            this.socket.onstatuspresence = (msg) => {
                console.info("Presence Message Received", msg);
                this.game.events.emit(NakamaPluginEvents.STATUS_PRESENCE, msg);
            }

            this.socket.onnotification = (notification) => {
                console.info('Notification received', notification);
                this.game.events.emit(NakamaPluginEvents.NOTIFICATION, notification);
            }
        } catch (error) {
            console.error(`Error connecting to socket`, error);
        }
    }

    sendEvent(eventName: string, ...args: any[]) {
        this.game.events.emit(eventName, args)
    }

    // Account

    async getAccount() : Promise<NakamaApi.AccountEmail> {
        return await this.client.getAccount(this.session);
    }

    async updateAccount(display_name: string, avatar_url: string, lang: string, location: string, timezone: string) {
        await this.client.updateAccount(this.session, {
            display_name,
            avatar_url,
            lang_tag: lang,
            location,
            timezone
        });
    }

    // Status

    setStatus(status: string) {
        // @ts-ignore: definition is wrong in nakama typings
        this.socket.send({ status_update: { status }});
    }

    appearOffline() {
        // @ts-ignore: definition is wrong in nakama typings
        this.socket.send({status_update: {}});
    }

    async getNotificationsList(limit=10, cursor?: string) : Promise<NakamaApi.NotificationList> {
        return await this.client.listNotifications(this.session, limit, cursor);
    }

    async deleteNotifications(notificationIds: Array<string>) {
        return await this.client.deleteNotifications(this.session, notificationIds);
    }

    async deleteAllNotifications() {
        console.log("Deleting all Notifications");
        const { notifications }  = await this.getNotificationsList();
        return await this.deleteNotifications(notifications!.map((notification: NakamaApi.Notification) => {
            return notification.id!;
        }));
    }

    // Users and friends
    async getUsers(usernames: Array<string>) : Promise<NakamaApi.Users> {
        return await this.client.getUsers(this.session, [], usernames, []);        
    }

    async getUsersById(ids: Array<string>) : Promise<NakamaApi.Users> {
        return await this.client.getUsers(this.session, ids,[], []);
    }

    async addFriends(ids: Array<string>, usernames: Array<string>) {
        const res = await this.client.addFriends(this.session, ids, usernames);
        this.game.events.emit(NakamaPluginEvents.FRIENDS_ADDED, res);
        return res;
    }

    async getFriendsList() : Promise<NakamaApi.Friends> {
        return await this.client.listFriends(this.session);
    }
    
    async blockFriends(ids: Array<string>, usernames: Array<string>) {
        const res =  await this.client.blockFriends(this.session, ids, usernames);
        this.game.events.emit(NakamaPluginEvents.FRIENDS_BLOCKED, res);
        return res;
    }

    async removeFriends(ids: Array<string>, usernames: Array<string>) {
        const res = await this.client.deleteFriends(this.session, ids, usernames);
        this.game.events.emit(NakamaPluginEvents.FRIENDS_REMOVED, res);
        return res;
    }

    async followUsers(ids: Array<string>) {
        // @ts-ignore: definition is wrong in nakama typings
        return await this.socket.send({ status_follow: { user_ids: ids }});
    }

    unfollowUsers(ids: Array<string>) {
        // @ts-ignore: definition is wrong in nakama typings
        this.socket.send({ status_unfollow: { user_ids: ids } });
    }

    async followFriends() {
        const { friends } = await this.getFriendsList();
        if (friends) {         
            return await this.followUsers(friends!.map((friend: NakamaApi.Friend) => friend.user!.id!));
        }
    }

    // Groups
    async getGroupsList(searchTerm: string, limit: number, cursor?: string) : Promise<NakamaApi.GroupList> {
        return await this.client.listGroups(this.session, searchTerm, cursor, limit);
    }

    async getUserGroupsList(userId?: string) : Promise<Array<Group>> {
        if (userId === undefined) {
            userId = this.session.user_id;
        }
        const res = await this.client.listUserGroups(this.session, userId!);
        return res.user_groups!.map(({group, state}) => {
            // const creator = await this.getUsersById([group!.creator_id!]);
            return new Group(this, group!, state!); //, (creator) ? creator[0] : undefined);
        });
    }

    async joinGroup(groupId: string) : Promise<boolean> {
        console.log("Join group request")
        const res = await this.client.joinGroup(this.session, groupId);
        this.game.events.emit(NakamaPluginEvents.GROUP_JOINED, res);
        return res;
    }

    async acceptGroupMemberRequest(groupId: string, userId: string) : Promise<Boolean> {
        return await this.client.addGroupUsers(this.session, groupId, [userId]);
    }

    async rejectGroupMemberRequest(groupId: string, userId: string) : Promise<Boolean> {
        return await this.client.addGroupUsers(this.session, groupId, [userId]);
    }

    async createGroup(name: string, description: string, language: string, isOpenGroup: boolean) : Promise<NakamaApi.Group> {
        const res = await this.client.createGroup(this.session, {
            name, description, lang_tag: language, open: isOpenGroup
        });
        this.game.events.emit(NakamaPluginEvents.GROUP_CREATED, res);
        return res;
    }

    // Matches

    // async createMatch() : Promise<Match> {
    //     const match = new Match(this);
    //     await match.create();
    //     return match;
    // }

    // async joinMatch(matchId: string) : Promise <Match> {
    //     const match = new Match(this, matchId);
    //     await match.join();
    //     return match;
    // }
}

export { NotificationCodes, FriendStates, NakamaPlugin, NakamaPluginEvents }