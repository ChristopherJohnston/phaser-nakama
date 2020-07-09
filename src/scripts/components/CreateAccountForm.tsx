import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

interface CreateAccountProps {
    onCancel(): void;
    onSubmit(email: string, username: string, password: string): void;
  }

const CreateAccountForm:React.FunctionComponent<CreateAccountProps> = ({onCancel, onSubmit}) => {
  const [email, setEmail] = React.useState<string>('');
  const [username, setUsername] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = React.useState<string>('');
  const [passwordValid, setPasswordValid] = React.useState<boolean>(true);
  const [passwordValidationMessage, setPasswordValidationMessage] = React.useState<string>('');
  const [passwordConfirmValid, setPasswordConfirmValid] = React.useState<boolean>(true);
  const [passwordConfirmValidationMessage, setPasswordConfirmValidationMessage] = React.useState<string>('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(email, username, password);
  }

  const passwordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length < 8) {
      setPasswordValid(false);
      setPasswordValidationMessage("Password length must be greater than 8 characters.");
    } else {
      setPasswordValid(true);
      setPasswordValidationMessage("");  
    }

    setPassword(event.target.value);
  }

  const passwordConfirmChange = (event: React.ChangeEvent<HTMLInputElement>) => {    
    if (event.target.value != password) {
      setPasswordConfirmValid(false);
      setPasswordConfirmValidationMessage("Passwords do not match");
    } else {
      setPasswordConfirmValid(true);
      setPasswordConfirmValidationMessage("Passwords Match");
    }

    setPasswordConfirm(event.target.value);
  }

  return (
    <div>
      <h2>Create Account</h2>
      <Form onSubmit={submit}>
        <Form.Group controlId="formCheckbox">
          <Form.Control
            required
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setUsername(event.target.value) }}
          />
        </Form.Group>
        <Form.Group controlId="formEmail">
          <Form.Control
            required
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setEmail(event.target.value) }}
            />
        </Form.Group>
        <Form.Group controlId="formPassword">
          <Form.Control
            required
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={passwordChange}
            isInvalid={(passwordValid == false)}
          />
          <Form.Control.Feedback>{passwordValidationMessage}</Form.Control.Feedback>
          <Form.Control.Feedback type="invalid">{passwordValidationMessage}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="formPasswordConfirm">
          <Form.Control
            required
            type="password"
            name="passwordConfirm"
            placeholder="Confirm Password"
            value={passwordConfirm}
            onChange={passwordConfirmChange}
            isInvalid={(passwordConfirmValid == false)}
          />
          <Form.Control.Feedback>{passwordConfirmValidationMessage}</Form.Control.Feedback>
          <Form.Control.Feedback type="invalid">{passwordConfirmValidationMessage}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit">Create Account</Button>
        </Form.Group>          
      </Form>
    </div>
  );
}

export default CreateAccountForm;