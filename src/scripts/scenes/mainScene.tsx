import React from 'react'
import { render } from 'react-dom'
import PhaserLogo from '../objects/phaserLogo'
import FpsText from '../objects/fpsText'

export default class MainScene extends Phaser.Scene {
  fpsText: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'MainScene' })
  }

  create() {
    new PhaserLogo(this, this.cameras.main.width / 2, 0)
    this.fpsText = new FpsText(this)

    // display the Phaser.VERSION
    this.add
      .text(this.cameras.main.width - 15, 15, `Phaser v${Phaser.VERSION}`, {
        color: '#000000',
        fontSize: 24
      })
      .setOrigin(1, 0)

    // create the react App component
    const App = () => (
      <div style={{ textAlign: 'center' }}>
      </div>
    )

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
    render(<App />, react.node)
    scaleReact();

    this.scale.on('resize', gameSize => {  
      scaleReact()
    })
  }

  update() {
    this.fpsText.update()
  }
}
