import React from 'react';
import * as NakamaApi from '@heroiclabs/nakama-js';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Row, Col, Form} from 'react-bootstrap';
import moment from 'moment';
import { GameContext } from "../scenes/mainScene";

const GroupSearch:React.FunctionComponent = () => {
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [cursor, setCursor] = React.useState<string>('');
    const [searchComplete, setSearchComplete] = React.useState<boolean>(false);
    const [groups, setGroups] = React.useState<Array<NakamaApi.Group>>(new Array<NakamaApi.Group>());
    const { nakama } = React.useContext(GameContext);

    const getGroups = async () => {
        const groups = await nakama!.getGroupsList(searchTerm, 100, cursor) as NakamaApi.GroupList;
        setGroups(groups.groups!);
        setSearchComplete(true);
        setCursor(groups.cursor!);
    }

    const joinGroup = async (id: string) => {
        try {
            await nakama!.joinGroup(id);        
            console.log(`Join requested for group ${id}`)
        } catch (error) {
            console.log(`Join request error`, error);
        }
    }

    const renderGroups = () : JSX.Element | null => {
        if (groups.length > 0) {
            console.log(`Users Found for Search Term ${searchTerm}`, groups);
            return (<Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created</th>
                        <th>Type</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map( (group: NakamaApi.Group) => {
                        return (<tr key={group.id}>
                            <td>{group.name}</td>
                            <td>{group.description}</td>
                            <td>{moment(group.create_time).fromNow()}</td>
                            <td>{(group.open) ? "Open Group": "Private Group"}</td>
                            <td>
                                <Button variant="primary" onClick={() => joinGroup(group.id!)}>Join</Button>
                            </td>
                        </tr>)
                    })}
                </tbody>
            </Table>);
        } else if (searchComplete) {
            return <div>No Groups Found</div>;
        } else {
            return null;
        }
    }    

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        getGroups();
    }

    return (
        <div>
            <Form onSubmit={submit}>
                <Form.Group as={Row}>
                    <Form.Label column sm={1}>Search:</Form.Label>
                    <Col sm={8}>
                        <Form.Control
                            required
                            placeholder="Enter a group name"
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
            {renderGroups()}
        </div>
    );
}

export default GroupSearch;  