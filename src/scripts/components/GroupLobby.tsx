import React from 'react';
import moment from 'moment';
import * as NakamaApi from '@heroiclabs/nakama-js';
import { NotificationCodes, NakamaPluginEvents, Group, GroupUserStatus } from '../plugins/Nakama';
import { Button, Table, Container, Row, Col, Alert} from 'react-bootstrap';
import { GameContext } from "../scenes/mainScene";

const GroupLobby:React.FunctionComponent<{group: Group}> = ({group}) => {
    const [groupUsers, setGroupUsers] = React.useState<Array<NakamaApi.GroupUser>>(new Array<NakamaApi.GroupUser>());
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const { game, nakama } = React.useContext(GameContext);

    const refreshGroupUserList = async () => {
        const groupUserList = await group.listMembers();
        console.info("Refreshing gruop users", groupUserList);
        setGroupUsers(groupUserList.group_users!);
    }

    React.useEffect(() => {
        const onNewNotification = (notification: NakamaApi.Notification) => {
            if (group !== undefined &&  notification.code === NotificationCodes.GROUP_JOIN_REQUEST)  {
                console.log(`New Group Join Request`, notification);
                refreshGroupUserList();
            }
        }

        const onGroupLeft = () => {
            if (group) {
                refreshGroupUserList();
            }
        }

        const onGroupDeleted = () => {
            closeGroupLobby();
        }

        game!.events.addListener(NakamaPluginEvents.GROUP_LEFT, onGroupLeft);
        game!.events.addListener(NakamaPluginEvents.GROUP_DELETED, onGroupDeleted);
        game!.events.addListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);

        return () => {
            game!.events.removeListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
            game!.events.removeListener(NakamaPluginEvents.GROUP_LEFT, onGroupLeft);
            game!.events.removeListener(NakamaPluginEvents.GROUP_DELETED, onGroupDeleted);
        }
    }, []);

    React.useEffect(() =>
    {
        refreshGroupUserList();
    }
    , [group])

    const getGroupUserStatus = (state: number) => {
        switch (state) {
            case GroupUserStatus.SuperAdmin:
                return "Super Admin";
            case GroupUserStatus.Admin:
                return "Admin";
            case GroupUserStatus.Member:
                return "Member";
            case GroupUserStatus.JoinRequest:
                return "Requested Membership";
            default:
                return "Unknown";
        }
    }

    const promoteMember = async (id: string) => {
        const result = await group.promoteMembers([id]);
        refreshGroupUserList();
    }

    const kickMember = async (id: string) => {
        const result = await group.kickMembers([id]);
        refreshGroupUserList();
    }

    const acceptMember = async (id: string) => {
        const result = await group.acceptMembers([id]);
        refreshGroupUserList();
    }

    const leaveGroup = async () => {
        try {
            return await group!.leave();
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    const getActions = (state: number, user: NakamaApi.User) => {
        if (user.id! === nakama!.session.user_id) {
            return <div>
                <Button variant="danger" onClick={leaveGroup}>Leave</Button>
            </div>
        }

        let promote = <Button variant="primary" onClick={() => promoteMember(user.id!)}>Promote</Button>
        let kick = <Button variant="danger" onClick={() => kickMember(user.id!)}>Kick</Button>
        let accept = <Button variant="success" onClick={() => acceptMember(user.id!)}>Accept</Button>

        switch (state) {
            case GroupUserStatus.SuperAdmin:
                return <div></div>;
            case GroupUserStatus.Admin:
                return <div>{promote}{kick}</div>
            case GroupUserStatus.Member:
                return <div>{promote}{kick}</div>
            case GroupUserStatus.JoinRequest:
                return <div>{accept}{kick}</div>
            default:
                return <div></div>;
        }
    }

    const closeGroupLobby = () => {        
        game!.events.emit('hideGroup');
    }


    const renderGroupUsers = () => {
        if (!groupUsers) { return null;}
        return groupUsers.map((groupUser: NakamaApi.GroupUser) => {
            const { state, user } = groupUser;
            return <tr key={user?.id}>
                <td>{(user?.display_name) ? `${user?.display_name} (${user?.username})` : user?.username}</td>
                <td>{(user?.location) ? user.location : "Unknown"}</td>
                <td>{moment(user?.create_time).fromNow()}</td>
                <td>{getGroupUserStatus(state!)}</td>
                <td>{getActions(state!, user!)}</td>
            </tr>
        });
    }

    if (!group) { return null; }

    return (
        <div>
            <div
                style={{
                    width: 880,
                    borderRadius: 8,
                    backgroundColor: '#dfd4d4',
                    border: '2px #aeacac solid',
                    margin: '0 auto',
                    position: 'absolute',
                    bottom: 10,
                    left: '50px',
                    padding: 25
                }}
            >
                <Button onClick={closeGroupLobby}>Close</Button>
                <h2>{group.groupName}</h2>
                <Alert variant="danger" show={errorMessage != ''} >{errorMessage}</Alert>
                <Container>
                    <Row>
                        <Col>{group.groupDescription}</Col>
                    </Row>
                    <Row></Row>
                    <Row>
                        <Col>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderGroupUsers()}
                            </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Container>
            </div>    
        </div>
    );
}

export default GroupLobby;  