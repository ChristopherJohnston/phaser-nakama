import React from 'react';
import LoginForm from './LoginForm';
import CreateAccountForm from './CreateAccountForm';
import Alert from 'react-bootstrap/Alert';
import { GameContext } from "../scenes/mainScene";

interface AuthenticationProps {
  onLoginSuccess(): void;
}

const Authentication:React.FunctionComponent<AuthenticationProps> = ({onLoginSuccess}) => {
  const [isCreateAccount, setIsCreateAccount] = React.useState<boolean>(false);
  const [loginError, setLoginError] = React.useState<string>('');
  const [loginErrorHeading, setLoginErrorHeading] = React.useState<string>('');
  const { nakama } = React.useContext(GameContext);

  const onSubmitLogin = async (email: string, password: string, rememberDevice: boolean) => {
    console.log("Submit Login", email, rememberDevice);

    try {
      await nakama!.authentication.email.login(email, password, rememberDevice);
      onLoginSuccess();
    } catch (error) {
      console.error(`Login Error`, error);
      setLoginError(error.message);
      setLoginErrorHeading('Login Error');
    }        
  }

  const onSubmitCreateAccount = async (email: string, username: string, password: string) => {
    console.log("Submit Create Account", email, username);
    try {
      await nakama!.authentication.email.register(email, password, username);
      onLoginSuccess();
    } catch (error) {
      console.error("Account Creation Error", error);
      setLoginError(error.message);
      setLoginErrorHeading('Create Account Error');  
    }    
  }

  let formToShow = (!isCreateAccount) ? (
    <LoginForm
        onSubmit={onSubmitLogin}
        onCreateAccount={() => { setIsCreateAccount(oldVal => true)}}
    />
  ) : (
    <CreateAccountForm
      onCancel={() => { setIsCreateAccount(oldVal => false) }}
      onSubmit={onSubmitCreateAccount}
    />
  );

  return (
    <div
      style={{
        width: 440,
        borderRadius: 8,
        backgroundColor: '#dfd4d4',
        border: '2px #aeacac solid',
        margin: '0 auto',
        position: 'absolute',
        top: 200,
        left: 'calc(50% - 220px)',
        padding: 25
      }}
    >
      <Alert variant="danger" hidden={(loginError == '')}>
        <Alert.Heading>{loginErrorHeading}</Alert.Heading>
        {loginError}
      </Alert>
      {formToShow}
    </div>
  );
}

export default Authentication;