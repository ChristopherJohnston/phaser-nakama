import React from 'react';
import Toast from 'react-bootstrap/Toast';
import { GameContext } from "../scenes/mainScene";

interface ToastNotification {
  header: JSX.Element,
  body: JSX.Element
}

const Toasts:React.FunctionComponent = () => {
    const [toastNotification, setToastNotification] = React.useState<ToastNotification>();
    const [showToast, setShowToast] = React.useState<boolean>(false);
    const { game } = React.useContext(GameContext);

    React.useEffect(() => {
      const onShowToast = (toastNotification: ToastNotification) => {
        console.info('Toast Notification', toastNotification)
        setToastNotification(toastNotification);
        setShowToast(st => true);
      }

      console.log('subscribing to showToast')
      game!.events.addListener('showToast', onShowToast);
      
      return () => {
          game!.events.removeListener('showToast', onShowToast);
      }
  }, []);  

  return (
      <Toast
          onClose={() => {setShowToast(st => !st)}}
          style={{position:'absolute', top: 0, right: 15}}
          delay={10000}
          show={showToast}
          autohide
      >        
          <Toast.Header closeButton={false}>
              {(toastNotification !== undefined) ? toastNotification!.header : null}
          </Toast.Header>
          <Toast.Body>{(toastNotification !== undefined) ? toastNotification!.body : null}</Toast.Body>
      </Toast>
  );
}

export { ToastNotification, Toasts };