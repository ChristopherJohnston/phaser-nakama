// import { Channel, ChannelType }  from './Channel';
import { NakamaPlugin, NakamaPluginEvents } from '.';
import { Session, Group as NakamaGroup, GroupUserList, User } from '@heroiclabs/nakama-js';

enum GroupUserStatus {
    SuperAdmin = 0,
    Admin = 1,
    Member = 2,
    JoinRequest = 3
}

class Group {
    plugin: NakamaPlugin;
    groupId: string;
    groupCreated: string;
    groupName: string;
    groupDescription: string;
    currentUserStatus: number;
    channelId?: string;
    groupOpen: boolean;
    groupCreator: User;

    constructor(plugin: NakamaPlugin, group: NakamaGroup, state: GroupUserStatus, creator?: User) {
        this.plugin = plugin;
        this.groupId = group.id!;
        this.groupCreator = creator!;
        this.groupName = group.name!;
        this.groupCreated = group.create_time!;
        this.groupDescription = group.description!;
        this.groupOpen = group.open!;
        this.currentUserStatus = state; // { 0: 'Superadmin', 1: 'Admin', 2: 'Member', 3: 'Join Request'}
    }

    // get channel() : Channel {
    //     return new Channel(this.plugin, ChannelType.Group, this.groupId);
    // }

    async listMembers() : Promise<GroupUserList> {
        return await this.plugin.client.listGroupUsers(this.plugin.session, this.groupId);
    }

    async update(groupInfo) : Promise<boolean> {
        if (this.currentUserStatus <= GroupUserStatus.Admin) {
            return await this.plugin.client.updateGroup(this.plugin.session, this.groupId, groupInfo);
        }
        else {
            return new Promise( () => { return false; });
        }
    }

    async getPendingMembers() : Promise<Array<User>> {
        const allMembers = await this.listMembers();
        return allMembers.group_users!.filter(user => user.state! == 3).map(user => user.user!);
    }

    async acceptMembers(userIds: Array<string>) : Promise<boolean> {
        if (this.currentUserStatus <= GroupUserStatus.Admin) {
            return await this.plugin.client.addGroupUsers(this.plugin.session, this.groupId, userIds)
        } else {
            return new Promise( () => { return false; });
        }
    }

    async promoteMembers(userIds) : Promise<boolean> {
        if (this.currentUserStatus === GroupUserStatus.SuperAdmin) {
            return await this.plugin.client.promoteGroupUsers(this.plugin.session, this.groupId, userIds);
        } else {
            return new Promise( () => { return false; });
        }
    }

    async kickMembers(userIds) : Promise<boolean> {
        if (this.currentUserStatus <= GroupUserStatus.Admin) {
            return await this.plugin.client.kickGroupUsers(this.plugin.session, this.groupId, userIds);
        } else {
            return new Promise( () => { return false; });
        }
    }

    async leave() : Promise<boolean> {
        try {
            const res = await this.plugin.client.leaveGroup(this.plugin.session, this.groupId);
            this.plugin.sendEvent(NakamaPluginEvents.GROUP_LEFT, res);
            return res;
        } catch (error) {
            const error_message = await error.json();
            console.log("Error leaving group", error_message);
            throw error_message;
        }
    }

    async delete() : Promise<boolean> {
        if (this.currentUserStatus === GroupUserStatus.SuperAdmin) {
            const res = await this.plugin.client.deleteGroup(this.plugin.session, this.groupId);
            this.plugin.sendEvent(NakamaPluginEvents.GROUP_DELETED, res);
            return res;
        } else {
            return new Promise( () => { return false; });
        }
    }
}

export {Group, GroupUserStatus}; 