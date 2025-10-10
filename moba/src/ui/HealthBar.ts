import Phaser from 'phaser'

export class HealthBar extends Phaser.GameObjects.Graphics {
  private widthPx: number
  private heightPx: number
  private value: number
  private max: number

  constructor(scene: Phaser.Scene, x: number, y: number, max: number, widthPx = 40, heightPx = 6) {
    super(scene)
    this.widthPx = widthPx
    this.heightPx = heightPx
    this.max = max
    this.value = max
    this.setPosition(x, y)
    this.setDepth(1000)
    scene.add.existing(this)
  }

  setValue(current: number) {
    this.value = Phaser.Math.Clamp(current, 0, this.max)
    this.drawBar()
  }

  follow(gameObject: Phaser.GameObjects.GameObject) {
    this.scene.events.on('update', () => {
      const worldPoint = new Phaser.Math.Vector2(0, 0)
      const cam = this.scene.cameras.main
      worldPoint.x = (gameObject as any).x
      worldPoint.y = (gameObject as any).y
      this.setPosition(worldPoint.x - this.widthPx / 2, worldPoint.y - 40)
    })
    return this
  }

  private drawBar() {
    this.clear()
    const pct = this.value / this.max
    this.fillStyle(0x000000, 0.6)
    this.fillRect(0, 0, this.widthPx, this.heightPx)

    const color = pct > 0.6 ? 0x21d07a : pct > 0.3 ? 0xffc107 : 0xff5252
    this.fillStyle(color, 1)
    this.fillRect(1, 1, (this.widthPx - 2) * pct, this.heightPx - 2)

    this.lineStyle(1, 0x111111, 1)
    this.strokeRect(0, 0, this.widthPx, this.heightPx)
  }
}
