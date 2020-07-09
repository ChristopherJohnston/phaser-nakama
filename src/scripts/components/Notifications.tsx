import React from 'react';
import * as NakamaApi from '@heroiclabs/nakama-js';
import Table from 'react-bootstrap/Table';
import { NotificationCodes, NakamaPluginEvents } from '../plugins/Nakama';
import Button from 'react-bootstrap/Button';
import { Container, Row, Col } from 'react-bootstrap';
import moment from 'moment';
import { ToastNotification } from "./Toasts";
import { GameContext } from "../scenes/mainScene";

const Notifications:React.FunctionComponent = () => {
    const [notifications, setNotifications] = React.useState<Array<NakamaApi.Notification>>(new Array<NakamaApi.Notification>());
    const [cacheableCursor, setCacheableCursor] = React.useState<string>("");
    const { game, nakama} = React.useContext(GameContext);

    const onNewNotification = (notification: NakamaApi.Notification) => {
      console.log("OnNewNotification")
      setNotifications(old => [...old, notification]);
      let tn: ToastNotification = {
        header: <strong className="mr-auto">{getToastHeading(notification.code!)}</strong>,
        body: <div>{notification.subject}{getNotificationActions(notification!)}</div>
      }
  
      game!.events.emit('showToast', tn);
    }

    React.useEffect(() => {
      game!.events.addListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
      getNotificationsList();
      
      return () => {
          game!.events.removeListener(NakamaPluginEvents.NOTIFICATION, onNewNotification);
      }
    }, []);
    
    const getNotificationsList = async () => {
      const { cacheable_cursor, notifications } = await nakama!.getNotificationsList();
      console.log(notifications)
      setCacheableCursor(cacheable_cursor!);
      setNotifications(notifications!);
    }
    
    const getToastHeading = (code: NotificationCodes) : string => {
      let heading: string;

      switch (code) {
        case NotificationCodes.FRIEND_REQUEST:
            heading = 'New Friend Request'
            break;
        case NotificationCodes.FRIEND_ACCEPT:
            heading = "Frind Request Accepted";
            break;
        case NotificationCodes.GROUP_JOIN_ACCEPT:
            heading = "Group Join Accepted"
            break;
        case NotificationCodes.GROUP_JOIN_REQUEST:
            heading = "Group Join Request"
            break;
        case NotificationCodes.CHAT_REQUEST:
            heading = "Chat Request"
            break;
        case NotificationCodes.FRIEND_JOINED_GAME:
            heading = "Game Started"
            break;
        default:
            heading = "New Notification"
            break;
      }
      return heading;
    }

  const dismissNotification = (id: string) => {
    console.info("dismissing notification")
    nakama!.deleteNotifications([id]);
    setNotifications(notifications => notifications.filter((n) => (n.id != id)));
  }

  const acceptFriendRequest = async (notification: NakamaApi.Notification) => {
    const result = await nakama!.addFriends([notification.sender_id!], []);
    console.info("add Friend result", result);
    dismissNotification(notification.id!);
  }

  const acceptGroupJoinRequest = (notification: NakamaApi.Notification) => {
    // @ts-ignore: nakama is injected at runtime
    // const result = await this.props.scene.nakama.addFriends([notification.sender_id!]);
  }

  const getNotificationActions = (notification: NakamaApi.Notification) : JSX.Element => {
    let action: JSX.Element;

    let code = notification.code;

    switch (code) {
      case NotificationCodes.FRIEND_REQUEST:
          action = <div><Button variant="success" onClick={() => acceptFriendRequest(notification)}>Accept</Button><Button variant="danger" onClick={() => dismissNotification(notification.id!)}>Ignore</Button></div>;
          break;
      case NotificationCodes.FRIEND_ACCEPT:
          action = (
            <div>
              <Button variant="primary">Chat</Button>
              <Button variant="info" onClick={() => dismissNotification(notification.id!)}>Dismiss</Button>
            </div>
          );
          break;
      case NotificationCodes.GROUP_JOIN_ACCEPT:
        // @ts-ignore: nakama is injected at runtime
          action = <div><Button variant="primary">Chat</Button><Button variant="info" onClick={() => dismissNotification(notification.id!)}>Dismiss</Button></div>;
          break;
      case NotificationCodes.GROUP_JOIN_REQUEST:
          action = <div><Button variant="success">Accept</Button><Button variant="danger" onClick={() => dismissNotification(notification.id!)}>Ignore</Button></div>;
          break;
      case NotificationCodes.CHAT_REQUEST:
          action = <div><Button variant="primary">Join</Button><Button variant="danger" onClick={() => dismissNotification(notification.id!)}>Ignore</Button></div>;
          break;
      case NotificationCodes.FRIEND_JOINED_GAME:
          action = <div><Button variant="primary">Join</Button><Button variant="info" onClick={() => dismissNotification(notification.id!)}>Dismiss</Button></div>;
          break;
      default:
          action = <td></td>
          break;
    }
    return action;
  }

  const renderNotification = (notification: NakamaApi.Notification) : JSX.Element => {
      return (
        <tr key={notification.id}>
            <td>{moment(notification.create_time).fromNow()}</td>
            <td>{notification.subject}</td>
            <td>{getNotificationActions(notification!)}</td>
        </tr>
      );
  }

  const renderNotifications = () => {
    if  (notifications.length > 0) {
        console.log("has notifications", notifications);
        return notifications.map(renderNotification);
    } else {
        return (<tr><td colSpan={3}>No Notifications</td></tr>);
    }
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
        top: 100,
        right: '50px',
        padding: 25
      }}
    >
      <h2>Notifications</h2>
      <Container>
          <Row>
              <Col>
                  <Table striped bordered hover>
                      <thead>
                          <tr>
                              <th>Time</th>
                              <th>Message</th>
                              <th>
                              <Button
                                variant="outline-secondary"
                                onClick={async () => {
                                  // @ts-ignore: nakama is injected into scene
                                  await this.props.scene.nakama.deleteAllNotifications();
                                  getNotificationsList();
                                }}>Clear All</Button>
                              </th>
                          </tr>
                      </thead>
                      <tbody>
                          {renderNotifications()}
                      </tbody>
                  </Table>
              </Col>
          </Row>
      </Container>
      </div>        
  );
}

export default Notifications;  