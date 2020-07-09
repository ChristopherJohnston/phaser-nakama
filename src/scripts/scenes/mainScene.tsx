import React from 'react'
import { render } from 'react-dom'
import PhaserLogo from '../objects/phaserLogo'
import Authentication from '../components/Authentication';
import { NakamaPlugin, Group } from '../plugins/Nakama'
import Notifications from '../components/Notifications';
import Friends from '../components/Friends';
import Groups from '../components/Groups';
import GroupLobby from '../components/GroupLobby';
import { Toasts } from '../components/Toasts';
import { IgnorePlugin } from 'webpack';


interface IGameContext {
  scene?: Phaser.Scene;
  game?: Phaser.Game;
  nakama?: NakamaPlugin;
} 

const GameContext = React.createContext<IGameContext>({});

class MainScene extends Phaser.Scene {
  nakama: NakamaPlugin;
  loginMessage: Phaser.GameObjects.Text;
  logoutButton: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' })
  }

  async create() {
    new PhaserLogo(this, this.cameras.main.width / 2, 0);

    this.loginMessage = this.add
      .text(this.cameras.main.width - 15, 15, "", {
        color: '#000000',
        fontSize: 24
      })
      .setOrigin(1, 0)
      .setVisible(false);

    this.logoutButton = this.add
      .text(this.cameras.main.width - 15, 40, 'Logout', { color: '#000000', fontSize: 24 })
      .setOrigin(1,0)
      .setInteractive()
      .setVisible(false)
      .on('pointerdown', () => {
        this.nakama.authentication.logout(true)
        this.events.emit('logout');
        this.loginMessage.setText("")
        this.logoutButton.setVisible(false);;
      });


    this.createReactForm()
  }

  createReactForm() {
    // create the react App component
    const App = () => {
      const gc = {scene: this, game: this.game, nakama: this.nakama};

      const [loggedIn, setLoggedIn] = React.useState<boolean>(false);
      const [friendsVisible, setFriendsVisible] = React.useState<boolean>(false);  
      const [groupsVisible, setGroupsVisible] = React.useState<boolean>(false);
      const [group, setGroup] = React.useState<Group>();
      const [notificationsVisible, setNotificationsVisible] = React.useState<boolean>(false);

      const toggleFriends = () => {
        setFriendsVisible(visible => !visible);
      }

      const toggleGroups = () => {
        setGroupsVisible(visible => !visible);
      }

      const toggleNotifications = () => {
        setNotificationsVisible(visible => !visible);
      }

      const onShowGroup = (show: boolean, group: Group) => {
        console.info("setting group", group)
        setGroup(group);
        setGroupsVisible(gv => !gv);
      }

      const onHideGroup = (group: Group) => {
        setGroup(undefined);
        setGroupsVisible(gv => !gv);
      }

      const onLogout = () => {
        setLoggedIn(oldVal => !oldVal);
      }

      const restoreLogin = async () => {
        if (await this.nakama.authentication.restore()) { 
          loginSuccess();
        } else {
          setLoggedIn(oldVal => false);
        }
      }

      const loginSuccess = (message?: string) => {
        setLoggedIn(oldVal => true)
        this.onLogin(message);
      }

      React.useEffect( () => {      
        restoreLogin();

        console.info("setting key commands")  

        // TODO: make these visible with buttons rather than key commands
        this.input.keyboard.on('keydown-N', toggleNotifications);
        this.input.keyboard.on('keydown-F', toggleFriends);
        this.input.keyboard.on('keydown-G', toggleGroups);
        this.game.events.addListener('showGroup', onShowGroup)
        this.game.events.addListener('hideGroup', onHideGroup)
        this.game.events.addListener('logout', onLogout)
      }, []);


      if (!loggedIn) {
        return <GameContext.Provider value={gc}>
          <div style={{ textAlign: 'center' }}><Authentication onLoginSuccess={loginSuccess} /></div>
        </GameContext.Provider>
      }
      
      // TODO: Toasts only display when friends and notifications screens are open - have this subscribe to the relevant events.
      return <div style={{ textAlign: 'center' }}>
        <GameContext.Provider value={gc}>
          <Toasts />          
          {(notificationsVisible) ? <Notifications /> : null}
          {(friendsVisible) ? <Friends /> : null}
          {(groupsVisible) ? <Groups/> : null}
          {(group !== undefined) ? <GroupLobby group={group} /> : null}
        </GameContext.Provider>
      </div>
    }

    // creating the react dom element
    let reactDiv = document.getElementById('react')
    if (!reactDiv) throw new Error('#react not found')

    reactDiv.addEventListener('mousedown', (event: Event) => {
      // if the click is not on the root react div, we call stopPropagation() 
      let target = event.target as HTMLElement
      if (target.id !== 'react') event.stopPropagation()
    })

    // @ts-ignore
    let react = this.add.dom(0, 0, reactDiv, {
      top: this.scale.canvas.offsetTop + 'px',
      left: this.scale.canvas.offsetLeft + 'px',
      height: this.cameras.main.displayHeight + 'px',
      width: this.cameras.main.displayWidth + 'px'
    })

    const scaleReact = () => {
      let scale = 1 / this.scale.displayScale.x
      react.setScale(scale).setOrigin(0)

      reactDiv!.style.top = this.scale.canvas.offsetTop + 'px';
      reactDiv!.style.left = this.scale.canvas.offsetLeft + 'px';
      reactDiv!.style.height = this.cameras.main.displayHeight + 'px';
      reactDiv!.style.width = this.cameras.main.displayWidth + 'px';
    }

    this.input.setTopOnly(true)

    // initialize react and scale
    render(<App/>, react.node)
    scaleReact();

    this.scale.on('resize', gameSize => {  
      scaleReact()
    })
  }

  async onLogin(message?: string) {
    message = (message) ? message : `Welcome Back, ${this.nakama.session.username}`
    console.log(message);

    this.loginMessage.setText(message).setVisible(true);
    this.logoutButton.setVisible(true);

    const friendsList = await this.nakama.followFriends();
    console.log("Friends Online", friendsList.status);
  }
}

export { IGameContext, GameContext, MainScene};