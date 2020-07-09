import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

interface LoginProps {
  onSubmit(email: string, password: string, rememberDevice: boolean): void;
  onCreateAccount(): void;
}

const LoginForm:React.FunctionComponent<LoginProps> = ({onSubmit, onCreateAccount}) => {
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [rememberDevice, setRememberDevice] = React.useState<boolean>(false);
  
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSubmit(email, password, rememberDevice);
  }

  return (
    <div>
      <h2>Login</h2>
      <Form onSubmit={submit}>
        <Form.Group controlId="formEmail">
          <Form.Control
            required
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={ (event: React.ChangeEvent<HTMLInputElement>) => { setEmail(event.target.value); }}
            />
        </Form.Group>
        <Form.Group controlId="formPassword">
          <Form.Control
            required
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={ (event: React.ChangeEvent<HTMLInputElement>) => { setPassword(event.target.value); }}
          />
        </Form.Group>
        <Form.Group controlId="formCheckbox">
          <Form.Check
            type="switch"
            name="rememberDevice"
            label="Remember This Device"
            checked={rememberDevice}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => { setRememberDevice(evt.target.checked); }}
            />
        </Form.Group>
        <Button variant="primary" type="submit">Login</Button>
        <Form.Group>
          <div className='new-account'><span>Dont Have An Account?</span></div>
        </Form.Group>
        <Button variant="secondary" onClick={onCreateAccount}>Create New Account</Button>
      </Form>
    </div>
  );
}

export default LoginForm;