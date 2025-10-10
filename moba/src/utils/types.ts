export type Team = 'blue' | 'red'

export interface Health {
  max: number
  current: number
}

export interface Unit extends Phaser.Physics.Arcade.Sprite {
  team: Team
  health: Health
}
