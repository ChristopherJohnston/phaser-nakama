// import 'bootstrap/dist/css/bootstrap.css';

import 'phaser'
import { MainScene } from './scenes/mainScene';
import PreloadScene from './scenes/preloadScene';
import { NakamaPlugin } from "./plugins/Nakama";

const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  dom: {
    createContainer: false
  },
  plugins: {
    global: [
        { key: 'Nakama', plugin: NakamaPlugin, start: true, mapping: 'nakama' }
    ]
  },
  scene: [PreloadScene, MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 400 }
    }
  }
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(config)
})
