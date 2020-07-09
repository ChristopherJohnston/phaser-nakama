import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import * as NakamaApi from '@heroiclabs/nakama-js';
import { Row, Col, Form} from 'react-bootstrap';
import moment from 'moment';
import { GameContext } from "../scenes/mainScene";

const UserSearch:React.FunctionComponent = () => {
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [searchComplete, setSearchComplete] = React.useState<boolean>(false);
    const [users, setUsers] = React.useState<Array<NakamaApi.User>>(new Array<NakamaApi.User>());
    const { nakama } = React.useContext(GameContext);

    const addFriend = (id: string) => {
        nakama!.addFriends([id], []);        
    }

    const blockFriend = (id: string) => {
        nakama!.blockFriends([id], []);
    }

    const renderUsers = () : JSX.Element | null => {
        if  (users.length > 0) {
            console.log(`Users Found for Search Term ${searchTerm}`, users);
            return (<Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map( (user: NakamaApi.User) => {
                        return (<tr key={user.id}>
                            <td>{(user.display_name) ? `${user.display_name} (${user.username})` : user.username}</td>
                            <td>{(user.location) ? user.location : "Unknown"}</td>
                            <td>{(user.online) ? "Online" : "Offline"}</td>
                            <td>{moment(user.create_time).fromNow()}</td>
                            <td>
                                <Button variant="primary" onClick={() => {addFriend(user!.id!)}}>Add Friend</Button>
                                <Button variant="danger" onClick={() => {blockFriend(user!.id!)}}>Block</Button>
                            </td>
                        </tr>)
                    })}
                </tbody>
            </Table>);
        } else if (searchComplete) {
            return <div>No Users Found</div>;
        } else {
            return null;
        }
    }
    
    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const users = await nakama!.getUsers([searchTerm]);
        setUsers(users.users ?? new Array<NakamaApi.User>());
        setSearchComplete(s => true);
    }

    return (
        <div>
            <Form onSubmit={submit}>
                <Form.Group as={Row}>
                    <Form.Label column sm={1}>Search:</Form.Label>
                    <Col sm={8}>
                        <Form.Control
                            required
                            placeholder="Enter a Username"
                            name="searchTerm"
                            value={searchTerm}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                        />
                        </Col>
                        <Col>
                            <Button variant="primary" type="submit">Search</Button>
                        </Col>
                </Form.Group>
            </Form>
            {renderUsers()}
        </div>
    );
}

export default UserSearch;  