import Phaser from 'phaser'
import { HealthBar } from '@/ui/HealthBar'

type Team = 'blue' | 'red'

class Tower extends Phaser.Physics.Arcade.Sprite {
  team: Team
  range: number
  fireCooldownMs: number
  lastShotAtMs: number

  constructor(scene: Phaser.Scene, x: number, y: number, team: Team) {
    super(scene, x, y, '')
    this.team = team
    this.range = 280
    this.fireCooldownMs = 800
    this.lastShotAtMs = 0
  }
}

class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number
  speed: number
  team: Team

  constructor(scene: Phaser.Scene, x: number, y: number, team: Team, damage = 25) {
    super(scene, x, y, '')
    this.team = team
    this.damage = damage
    this.speed = 600
  }
}

class Hero extends Phaser.Physics.Arcade.Sprite {
  team: Team
  moveSpeed: number
  health: { max: number; current: number }
  healthbar?: HealthBar
  qCooldownMs: number
  qLastCastMs: number

  constructor(scene: Phaser.Scene, x: number, y: number, team: Team) {
    super(scene, x, y, '')
    this.team = team
    this.moveSpeed = 260
    this.health = { max: 1000, current: 1000 }
    this.qCooldownMs = 900
    this.qLastCastMs = -99999
  }
}

export class GameScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  keys!: { q: Phaser.Input.Keyboard.Key }

  hero!: Hero
  projectiles!: Phaser.Physics.Arcade.Group
  creeps!: Phaser.Physics.Arcade.Group
  towers!: Phaser.Physics.Arcade.Group

  constructor() {
    super('game')
  }

  preload() {}

  create() {
    this.cameras.main.setBackgroundColor('#0a0f1a')

    const mapWidth = 2000
    const mapHeight = 1400
    const bg = this.add.rectangle(mapWidth / 2, mapHeight / 2, mapWidth, mapHeight, 0x0d1321)
    bg.setStrokeStyle(4, 0x0f2137)

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight)

    this.projectiles = this.physics.add.group({ classType: Projectile, maxSize: 200, runChildUpdate: true })
    this.creeps = this.physics.add.group({ maxSize: 200 })
    this.towers = this.physics.add.group({ classType: Tower, maxSize: 20 })

    this.hero = new Hero(this, 300, mapHeight / 2, 'blue')
    this.add.existing(this.hero)
    this.physics.add.existing(this.hero)
    ;(this.hero.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true)

    const heroCircle = this.add.circle(this.hero.x, this.hero.y, 18, 0x4fc3f7)
    heroCircle.setDepth(1)
    this.hero.on('changedata', () => {})
    this.events.on('update', () => {
      heroCircle.setPosition(this.hero.x, this.hero.y)
    })

    const hb = new HealthBar(this, this.hero.x, this.hero.y - 40, this.hero.health.max)
    hb.follow(this.hero)
    hb.setValue(this.hero.health.current)
    this.hero.healthbar = hb

    const blueTower = new Tower(this, 600, mapHeight / 2, 'blue')
    const redTower = new Tower(this, mapWidth - 600, mapHeight / 2, 'red')
    this.add.existing(blueTower)
    this.add.existing(redTower)
    this.physics.add.existing(blueTower)
    this.physics.add.existing(redTower)

    const blueTowerShape = this.add.rectangle(blueTower.x, blueTower.y, 40, 40, 0x4fc3f7)
    const redTowerShape = this.add.rectangle(redTower.x, redTower.y, 40, 40, 0xff5252)
    this.events.on('update', () => {
      blueTowerShape.setPosition(blueTower.x, blueTower.y)
      redTowerShape.setPosition(redTower.x, redTower.y)
    })

    this.towers.add(blueTower)
    this.towers.add(redTower)

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = { q: this.input.keyboard!.addKey('Q') }

    this.time.addEvent({ delay: 4000, loop: true, callback: this.spawnCreepWave, callbackScope: this })

    this.physics.add.overlap(this.projectiles, this.creeps, this.onProjectileHit, undefined, this)
    this.physics.add.overlap(this.projectiles, this.towers, this.onProjectileHitTower, undefined, this)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      this.castQ(world.x, world.y)
    })
  }

  private castQ(targetX: number, targetY: number) {
    const now = this.time.now
    if (now - this.hero.qLastCastMs < this.hero.qCooldownMs) return
    this.hero.qLastCastMs = now

    const proj = this.projectiles.get(this.hero.x, this.hero.y, '') as Projectile
    if (!proj) return
    proj.team = this.hero.team
    proj.damage = 120
    proj.setActive(true).setVisible(false)
    this.add.existing(proj)
    this.physics.add.existing(proj)

    const angle = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, targetX, targetY)
    const vx = Math.cos(angle) * proj.speed
    const vy = Math.sin(angle) * proj.speed
    ;(proj.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy)

    const sprite = this.add.rectangle(proj.x, proj.y, 10, 10, 0xfdd835)
    sprite.setDepth(2)
    this.events.on('update', () => {
      sprite.setPosition(proj.x, proj.y)
    })

    this.time.delayedCall(1500, () => {
      sprite.destroy()
      proj.destroy()
    })
  }

  private spawnCreepWave() {
    const pathY = [this.scale.height / 2 - 100, this.scale.height / 2 + 100]
    for (const y of pathY) {
      for (let i = 0; i < 4; i++) {
        const creep = this.physics.add.sprite(200 - i * 30, y, '')
        ;(creep as any).team = 'blue'
        ;(creep as any).health = { max: 300, current: 300 }
        this.creeps.add(creep)

        const rect = this.add.rectangle(creep.x, creep.y, 14, 14, 0x90caf9)
        const hb = new HealthBar(this, creep.x, creep.y - 20, 300, 30, 4)
        hb.follow(creep)
        hb.setValue(300)

        this.events.on('update', () => {
          rect.setPosition(creep.x, creep.y)
        })

        this.tweens.add({
          targets: creep,
          x: this.scale.width + 1200,
          duration: 16000,
          ease: 'Linear'
        })
      }
    }
  }

  private onProjectileHit(projectileGO: Phaser.GameObjects.GameObject, creepGO: Phaser.GameObjects.GameObject) {
    const projectile = projectileGO as Projectile
    const creep = creepGO as Phaser.Physics.Arcade.Sprite & { health: { max: number; current: number } }

    if ((projectile as any).team === (creep as any).team) return

    ;(creep as any).health.current -= projectile.damage
    const hb = (creep as any).list?.find((obj: any) => obj instanceof HealthBar) as HealthBar | undefined
    if ((creep as any).health.current <= 0) {
      creep.destroy()
    }
    projectile.destroy()
  }

  private onProjectileHitTower(projectileGO: Phaser.GameObjects.GameObject, towerGO: Phaser.GameObjects.GameObject) {
    const projectile = projectileGO as Projectile
    const tower = towerGO as Tower
    if (projectile.team === tower.team) return
    projectile.destroy()
  }

  update(time: number, delta: number): void {
    const body = this.hero.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    const speed = this.hero.moveSpeed
    if (this.cursors.left?.isDown) body.setVelocityX(-speed)
    if (this.cursors.right?.isDown) body.setVelocityX(speed)
    if (this.cursors.up?.isDown) body.setVelocityY(-speed)
    if (this.cursors.down?.isDown) body.setVelocityY(speed)

    body.velocity.normalize().scale(speed)

    // Tower AI: simple targeting of nearest enemy creep/hero
    this.towers.children.each((tw) => {
      const tower = tw as Tower
      const now = this.time.now
      if (now - tower.lastShotAtMs < tower.fireCooldownMs) return

      const candidates: Phaser.GameObjects.GameObject[] = []
      this.creeps.getChildren().forEach((c) => candidates.push(c))
      candidates.push(this.hero)

      let bestTarget: Phaser.GameObjects.GameObject | null = null
      let bestDist = Number.MAX_VALUE
      for (const t of candidates) {
        const isEnemy = (t as any).team && (t as any).team !== tower.team
        if (!isEnemy) continue
        const d = Phaser.Math.Distance.Between(tower.x, tower.y, (t as any).x, (t as any).y)
        if (d <= tower.range && d < bestDist) {
          bestDist = d
          bestTarget = t
        }
      }

      if (bestTarget) {
        tower.lastShotAtMs = now
        const proj = this.projectiles.get(tower.x, tower.y, '') as Projectile
        if (!proj) return
        proj.team = tower.team
        proj.damage = 50
        proj.setActive(true).setVisible(false)
        this.add.existing(proj)
        this.physics.add.existing(proj)

        const angle = Phaser.Math.Angle.Between(tower.x, tower.y, (bestTarget as any).x, (bestTarget as any).y)
        const vx = Math.cos(angle) * proj.speed
        const vy = Math.sin(angle) * proj.speed
        ;(proj.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy)

        const sprite = this.add.rectangle(proj.x, proj.y, 8, 8, 0xff7043)
        sprite.setDepth(2)
        this.events.on('update', () => {
          sprite.setPosition(proj.x, proj.y)
        })

        this.time.delayedCall(1200, () => {
          sprite.destroy()
          proj.destroy()
        })
      }
    })
  }
}
