import React from 'react';
import moment from 'moment';
import * as NakamaApi from '@heroiclabs/nakama-js';
import { FriendStates, NotificationCodes, NakamaPluginEvents } from '../plugins/Nakama';
import { Button, Table, Container, Row, Col, Dropdown, DropdownButton, ButtonGroup, Accordion, Card, Toast } from 'react-bootstrap';
import UserSearch from './UserSearch';
import { GameContext } from "../scenes/mainScene";
import { ToastNotification } from "./Toasts";

const Friends:React.FunctionComponent = () => {
    const [friends, setFriends] = React.useState<Array<NakamaApi.Friend>>(new Array<NakamaApi.Friend>());
    const { game, nakama } = React.useContext(GameContext);

    const getFriendsList = async () => {
        const friends = await nakama!.getFriendsList() as NakamaApi.Friends;
        setFriends(friends.friends ?? new Array<NakamaApi.Friend>());
    }

    const onPresenceNotification = (presence) => {
        console.log("Status Presences");
        if (presence.joins) {
            presence.joins.forEach((user) => { 
                friends.forEach((friend) => {
                    if (friend.user!.id === user.user_id) {
                        friend.user!.online = true;
                    }
                });

                let tn: ToastNotification = {
                    header: <strong className="mr-auto">Friend Online</strong>,
                    body: <div><div>{user.username} is now Online</div><div><Button variant="primary">Chat</Button></div></div>
                }
                console.log('emitting', tn)
                game!.events.emit('showToast', tn);
            });        
        }

        if (presence.leaves) {
            presence.leaves.forEach((user) => {
                friends.forEach((friend) => {
                    if (friend.user!.id === user.user_id) {
                        friend.user!.online = false;
                    }
                });

                let tn: ToastNotification = {
                    header: <strong className="mr-auto">Friend Offline</strong>,
                    body: <div><div>{user.username} is now Offline</div><div><Button variant="primary">Chat</Button></div></div>
                }
                console.log("leaving")
                game!.events.emit('showToast', tn);
            });  
        }
    }

    const onNewNotification = (notification: NakamaApi.Notification) => {
        if (notification.code == NotificationCodes.FRIEND_ACCEPT || notification.code == NotificationCodes.FRIEND_REQUEST) {
            console.info("Friend Notification Received");
            getFriendsList();
        }
    }

    React.useEffect(() => {
        const refreshFriendsList = (res: Array<string>) => getFriendsList();

        console.info('subscribing to friends events')
        game!.events.addListener(NakamaPluginEvents.STATUS_PRESENCE, onPresenceNotification);
        game!.events.addListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
        game!.events.addListener(NakamaPluginEvents.FRIENDS_ADDED, refreshFriendsList);
        game!.events.addListener(NakamaPluginEvents.FRIENDS_BLOCKED, refreshFriendsList);
        game!.events.addListener(NakamaPluginEvents.FRIENDS_REMOVED, refreshFriendsList);
        getFriendsList();

        return () => {
            console.info('unsubscribing fromfriends events')
            game!.events.removeListener(NakamaPluginEvents.STATUS_PRESENCE, onPresenceNotification);
            game!.events.removeListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
            game!.events.removeListener(NakamaPluginEvents.FRIENDS_ADDED, refreshFriendsList);
            game!.events.removeListener(NakamaPluginEvents.FRIENDS_BLOCKED, refreshFriendsList);
            game!.events.removeListener(NakamaPluginEvents.FRIENDS_REMOVED, refreshFriendsList);
        }
    }, []);


    const addFriend = async (id: string) => {        
        await nakama!.addFriends([id], []);
        getFriendsList();        
    }

    const blockFriend = async (id: string) => {
        await nakama!.blockFriends([id], []);
        getFriendsList();
    }

    const removeFriend = async (id: string) => {
        await nakama!.removeFriends([id], []);
        setFriends(f => f.filter((f) => (f.user!.id != id)));
    }

    const getFriendActions = (friend: NakamaApi.Friend) : JSX.Element => {
        let actions: JSX.Element;

        switch (friend.state) {
            case FriendStates.FRIEND:
                actions = (
                    <div>
                        <Button variant="primary">Chat</Button>
                        <DropdownButton as={ButtonGroup} variant="secondary" id="dropdown-split-actions" title="Actions">
                            <Dropdown.Item eventKey="2" onClick={() => {removeFriend(friend.user!.id!)}}>Unfriend</Dropdown.Item>
                        </DropdownButton>
                    </div>
                );
                break;
            case FriendStates.INVITE_RECEIVED:
                actions = (
                    <div>
                        <Button variant="primary" onClick={() => {addFriend(friend.user!.id!)}}>Accept</Button>
                        <Button variant="warning" onClick={() => {removeFriend(friend.user!.id!)}}>Reject</Button>
                        <Button variant="danger" onClick={() => {blockFriend(friend.user!.id!)}}>Block</Button>
                    </div>
                );
                break;
            case FriendStates.INVITE_SENT:
                actions = (
                    <div>
                        <Button variant="primary" onClick={() => {removeFriend(friend.user!.id!)}}>Cancel</Button>
                        <Button variant="danger" onClick={() => {blockFriend(friend.user!.id!)}}>Block</Button>
                    </div>
                );
                break;
            case FriendStates.BLOCKED:
                actions = (
                    <div>
                        <Button variant="primary" onClick={() => {removeFriend(friend.user!.id!)}}>Unblock</Button>
                    </div>
                );
                break;
            default:
                actions = <div></div>
        }

        return actions;
    }

    const getFriendState = (code: FriendStates) : string => {
        let state: string;

        switch (code) {
            case FriendStates.FRIEND:
                state = "Friend";
                break;
            case FriendStates.INVITE_RECEIVED:
                state = "Friend Requested";
                break;
            case FriendStates.INVITE_SENT:
                state = "Friend Invitation Sent";
                break;
            case FriendStates.BLOCKED:
                state = "Blocked";
                break;
            default:
                state = "Unknown";
        }

        return state;        
    }

    const renderFriends = () => {
        if  (friends.length > 0) {
            console.log("has friends", friends);
            return friends!.map( (friend) => {
                const user = friend.user!
                return <tr key={user.id}>
                    <td>{(user.display_name) ? `${user.display_name} (${user.username})` : user.username}</td>
                    <td>{(user.location) ? user.location : "Unknown"}</td>
                    <td>{moment(user.create_time).fromNow()}</td>
                    <td>{getFriendState(friend.state!)}</td>
                    <td>{(user.online) ? "Online" : "Offline"}</td>
                    <td>{getFriendActions(friend)}</td>
                </tr>
            });
        } else {
            return (<tr><td colSpan={6}>No Friends</td></tr>);
        }
      }

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
                <h2>Friends</h2>
                <Container>
                    <Row>
                        <Col>
                            <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Joined</th>
                                    <th>Friend State</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderFriends()}
                            </tbody>
                            </Table>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        <Accordion>
                            <Card>
                                <Card.Header>
                                    <Accordion.Toggle as={Button} variant="outline-primary" eventKey="0">Find a Friend</Accordion.Toggle>
                                </Card.Header>
                                <Accordion.Collapse eventKey="0">
                                    <Card.Body><UserSearch /></Card.Body>
                                </Accordion.Collapse>
                            </Card>
                        </Accordion>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
}

export default Friends;  