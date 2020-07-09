import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { GameContext } from "../scenes/mainScene";

const GroupCreateForm:React.FunctionComponent = () => {
  const [name, setName] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [language, setLanguage] = React.useState<string>('en');
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { nakama } = React.useContext(GameContext);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    nakama!.createGroup(name, description, language, isOpen);
  }
  
  return (
    <div>
      <h2>Create Group</h2>
      <Form onSubmit={submit}>
        <Form.Group controlId="formName">
          <Form.Control
            required
            type="text"
            name="name"
            placeholder="Group Name"
            value={name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formDescription">
          <Form.Control
            required
            type="text"
            placeholder="Group Description"
            name="description"
            value={description}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
            />
        </Form.Group>
        <Form.Group controlId="formLanguage">
              <Form.Label>Language</Form.Label>
              <Form.Control as="select">
                  <option value="en">English</option>
                  <option value="fr">French</option>
              </Form.Control>
          </Form.Group>
          <Form.Group controlId="formCheckbox">
          <Form.Check
            type="switch"
            name="isOpen"
            label="Public Group"
            checked={isOpen}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => { setIsOpen(evt.target.checked);}}
            />
        </Form.Group>
        <Form.Group>
          <Button variant="primary" type="submit">Create Group</Button>
        </Form.Group>          
      </Form>
    </div>
  );
}

export default GroupCreateForm;