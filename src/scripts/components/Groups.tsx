import React from 'react';
import moment from 'moment';
import * as NakamaApi from '@heroiclabs/nakama-js';
import { NotificationCodes, NakamaPluginEvents, Group, GroupUserStatus } from '../plugins/Nakama';
import { Button, Table, Container, Row, Col, Accordion, Card, Alert } from 'react-bootstrap';
import GroupSearch from './GroupSearch';
import GroupCreateForm from './GroupCreate';
import { GameContext } from "../scenes/mainScene";

const Groups:React.FunctionComponent = () => {
    const [groups, setGroups] = React.useState<Array<Group>>();
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const { game, nakama } = React.useContext(GameContext);

    const refreshGroups = async () => {        
        const groups = await nakama!.getUserGroupsList() as Array<Group>;
        setGroups(groups);
    }

    React.useEffect(() => { refreshGroups(); }, []);

    React.useEffect(() => {
        const onNewNotification = (notification: NakamaApi.Notification) => {
            if (notification.code === NotificationCodes.GROUP_JOIN_ACCEPT || notification.code === NotificationCodes.GROUP_JOIN_REQUEST)  {
                console.log(`New Group Notifiction`, notification);
                refreshGroups();
            }
        }

        game!.events.addListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);

        return () => {
            game!.events.removeListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
        }
    }, []);

    React.useEffect(() => {
        const onGroupCreated = (res: Array<string>) => {
            console.info("new group created")
            refreshGroups();
        }

        game!.events.addListener(NakamaPluginEvents.GROUP_CREATED, onGroupCreated);
        
        return () => {
            game!.events.removeListener(NakamaPluginEvents.GROUP_CREATED, onGroupCreated);
        }
    }, []);

    const leaveGroup = async (group: Group) : Promise<boolean> => {
        try {
            const res = await group.leave();
            setGroups((groups) => groups?.filter((g) => { g.groupId != group.groupId }));
            return res
        } catch (error) {
            console.log(error);
            setErrorMessage(error.message);
            return false;
        }
    }

    const deleteGroup = async (group: Group) : Promise<boolean> => {
        try {
            const res = await group.delete();
            setGroups((groups) => groups?.filter((g) => { g.groupId != group.groupId }));
            return res;
        } catch (error) {
            console.log(error.message);
            return false;
        }
    }

    const getGroupActions = (group: Group) : JSX.Element => {
        let actions: JSX.Element;

        switch (group.currentUserStatus) {
            case GroupUserStatus.SuperAdmin:
                actions = (
                    <div>
                        <Button variant="primary" onClick={() => { game!.events.emit('showGroup', true, group);}}>Open</Button>
                        <Button variant="warning" onClick={() =>  leaveGroup(group)}>Leave</Button>
                        <Button variant="danger" onClick={ () => { deleteGroup(group); }}>Delete</Button>
                    </div>
                );
                break;
            case GroupUserStatus.Admin:
            case GroupUserStatus.Member:
                actions= (
                    <div>
                        <Button variant="primary" onClick={() => { game!.events.emit('showGroup', true, group);}}>Open</Button>
                        <Button variant="warning" onClick={ () => { leaveGroup(group); }}>Leave</Button>
                    </div>
                )
                break;
            case GroupUserStatus.JoinRequest:
                actions = (
                    <div>
                        <Button variant="warning" onClick={() => { leaveGroup(group);}}>Leave</Button>
                    </div>
                );
                break;            
            default:
                actions = <div></div>
        }

        return actions;
    }

    const getGroupState = (group: Group) : string => {
        let state: string;

        switch (group.currentUserStatus) {
            case GroupUserStatus.SuperAdmin:
                state = "Super Admin";
                break;
            case GroupUserStatus.Admin:
                state = "Admin";
                break;
            case GroupUserStatus.Member:
                state = "Member";
                break;
            case GroupUserStatus.JoinRequest:
                state = "Requested Membership";
                break;
            default:
                state = "Unknown";
        }

        return state;        
    }

    const getGroupsTable = () => {
        return <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            { (groups && groups.length > 0) ? groups!.map( (group) => {
                return <tr key={group.groupId}>
                    <td>{group.groupName}</td>
                    <td>{group.groupDescription}</td>
                    <td>{moment(group.groupCreated).fromNow()}</td>
                    <td>{getGroupState(group)}</td>
                    <td>{(group.groupOpen) ? "Public Group" : "Private Group"}</td>
                    <td>{getGroupActions(group)}</td>
                </tr>
            }) :(<tr><td colSpan={6}>No Groups</td></tr>)
            }
        </tbody>
            </Table>
    }

    return (
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
            <h2>Groups</h2>
            <Alert variant="danger" show={errorMessage != ''} >{errorMessage}</Alert>
            <Container>
                <Row>
                    <Col>
                    {getGroupsTable()}
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Accordion>
                        <Card>
                            <Card.Header>
                                <Accordion.Toggle as={Button} variant="outline-primary" eventKey="0">Find a Group</Accordion.Toggle>
                            </Card.Header>
                            <Accordion.Collapse eventKey="0">
                                <Card.Body><GroupSearch /></Card.Body>
                            </Accordion.Collapse>
                        </Card>
                        <Card>
                            <Card.Header>
                                <Accordion.Toggle as={Button} variant="outline-primary" eventKey="1">Create a Group</Accordion.Toggle>
                            </Card.Header>
                            <Accordion.Collapse eventKey="1">
                                <Card.Body><GroupCreateForm /></Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    </Accordion>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Groups;  