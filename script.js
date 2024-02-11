const types = ['rock', 'paper', 'scissors']; // Define types
const imageScale = 0.25
const numPlayers = 99; // Adjust number of players
const minSpeed = 128;
const maxSpeed = 640;

function compareTypes(type1, type2) {
  // Define win-lose relationships
  const rules = {
    rock: { beats: 'scissors', loses: 'paper' },
    paper: { beats: 'rock', loses: 'scissors' },
    scissors: { beats: 'paper', loses: 'rock' }
  };

  return rules[type1].beats === type2 ? type1 : type2;
}

function getRandomVelocity(minSpeed, maxSpeed) {
  // Generate a random angle between 0 and 2 * Math.PI (radians)
  const angle = Math.random() * 2 * Math.PI;

  // Generate a random speed within the specified range
  const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;

  // Set the sprite's velocity using polar coordinates
  return {x : Math.cos(angle) * speed, y: Math.sin(angle) * speed};
}

class StartScreen extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScreen' });
  }

  preload() {
    // Load assets for start screen, e.g., background image, text styles
  }

  create() {
    // Add title text, instructions, and "Play Now" button
    this.titleText = this.add.text(config.width/2, config.height / 3, 'Rock Paper Scissors', { fontSize: 90, fill: '#fff', align: 'center'}).setOrigin(0.5, 0.5);
    this.instructionsText = this.add.text(config.width/2, config.height / 2, 'This is just a random tournament of RPS!\nBet on one and press any key or tap to start', { fontSize: 50, fill: '#fff', align: 'center', wordWrap: {width: config.width}}).setOrigin(0.5, 0.5);

    // Set up input listeners
    this.input.keyboard.on('keyup', () => {
      this.startGame();
    });
    this.input.once('pointerdown', () => {
      this.startGame();
    });
  }

  startGame() {
    this.scene.start('Game');
  }
}

class EndScreen extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScreen' });
  }

  init (data)
  {
    this.winner = data.winner;
  }

  preload() {
    // Load assets for end screen, e.g., background image, text styles
  }

  create() {
    // Display end message (e.g., "Game Over!"), winner information (if applicable)
    let winner = this.winner.charAt(0).toUpperCase() + this.winner.slice(1);
    this.gameOverText = this.add.text(config.width/2, config.height / 3, `Game Over! ${winner} won!\nDid you win?`, { fontSize: 90, fill: '#fff', align: 'center',  wordWrap: {width: config.width} }).setOrigin(0.5, 0.5);;
    this.playAgainText = this.add.text(config.width/2, config.height / 2, 'Press any key or tap to replay', { fontSize: 50, fill: '#fff', align: 'center' }).setOrigin(0.5, 0.5);;

    // Set up input listeners
    this.input.keyboard.on('keyup', () => {
      this.restartGame();
    });
    this.input.once('pointerdown', () => {
      this.restartGame();
    });
  }

  restartGame() {
    this.scene.start('Game');
  }
}

class Game extends Phaser.Scene
{
  rocks;
  papers;
  scissors;

  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Load sprites for each type
    for (const type of types) {
      this.load.image(type, `assets/${type}.png`);
    }
  }

  create() {
    // Create groups for each type on different sides
    this.rocks = this.physics.add.group();
    this.papers = this.physics.add.group();
    this.scissors = this.physics.add.group();

    // Place players randomly on sides
    types.forEach(type => {
      for (let i = 0; i < numPlayers/3; i++) {
        let sprite = this.physics.add.sprite(Phaser.Math.Between(0, config.width), Phaser.Math.Between(0, config.height), type);
        switch (type) {
          case 'rock': this.rocks.add(sprite); sprite.body.debugBodyColor = 0xadfefe; break;
          case 'paper': this.papers.add(sprite); sprite.body.debugBodyColor = 0x09b500; break;
          case 'scissors': this.scissors.add(sprite); sprite.body.debugBodyColor = 0xb21d0a; break;
        }
        let speed = getRandomVelocity(minSpeed, maxSpeed);
        sprite.setScale(imageScale);
        sprite.setVelocity(speed.x, speed.y);
        sprite.setBounce(1.0).setCollideWorldBounds(true); // Add bouncing on collision
      }
    });

    this.label = Array(3);
    // Add scorecard for each type
    for (let i = 0; i < types.length; i++)
    {
      let w = i * config.width / 3;
      let h = 0;
      this.label[i] = this.add.text(w, h, '', { fontSize: 52, fill: '#fff' });
    }
    this.updateScoreBoard();

    this.isPaused = false;
    // Set up input listeners
    this.input.keyboard.on('keyup', () => {
      this.toggleGame();
    });
    // Not doing pointerdown since that is not triggered once the physics is paused!
  }

  update() {
      // Add collision between groups
      this.physics.overlap(this.rocks, this.papers, this.handleCollision, null, this);
      this.physics.overlap(this.papers, this.scissors, this.handleCollision, null, this);
      this.physics.overlap(this.scissors, this.rocks, this.handleCollision, null, this);
  }

  updateScoreBoard()
  {
    let count = {}
    count['rock'] = this.rocks.children.entries.length;
    count['paper'] = this.papers.children.entries.length;
    count['scissors'] = this.scissors.children.entries.length;
    // Update scorecard for each type
    for (let i = 0; i < types.length; i++)
    {
      let w = i * config.width / 3;
      let h = 0;
      this.label[i].setText(`${types[i]}: ${count[types[i]]}`);
    }
  }

  toggleGame()
  {
    console.log("Toggle! ", this.isPaused);
    if (this.isPaused)
    {
      this.isPaused = false;
      this.physics.resume(); // Resume physics updates
    }
    else
    {
      this.isPaused = true;
      this.physics.pause(); // Stop physics updates
    }
  }

  handleCollision(sprite1, sprite2) {
    // Get the groups for both sprites
    const sprite1Group = this.getSpriteGroup(sprite1);
    const sprite2Group = this.getSpriteGroup(sprite2);

    // Remove sprites from their original groups
    sprite1Group.remove(sprite1, true);
    sprite2Group.remove(sprite2, true);

    // Determine winner based on types
    const winner = compareTypes(sprite1.texture.key, sprite2.texture.key);

    // Update loser type and sprite texture
    if (winner === sprite1.texture.key) {
      sprite2.setTexture(winner);
      sprite1Group.add(sprite1, true);
      sprite1Group.add(sprite2, true);
    } else {
      sprite1.setTexture(winner);
      sprite2Group.add(sprite1, true);
      sprite2Group.add(sprite2, true);
    }

    // Reset velocity since changing groups sets it to 0 for some reason.
    let speed = getRandomVelocity(minSpeed, maxSpeed);
    sprite1.setVelocity(speed.x, speed.y);
    sprite2.setVelocity(speed.x, speed.y);
    sprite1.setBounce(1.0).setCollideWorldBounds(true); // Add bouncing on collision
    sprite2.setBounce(1.0).setCollideWorldBounds(true); // Add bouncing on collision

    this.updateScoreBoard();
    // Check for game end condition (one type remaining)
    const rockCount = this.rocks.children.entries.length;
    const paperCount = this.papers.children.entries.length;
    const scissorCount = this.scissors.children.entries.length;

    if (rockCount === numPlayers || paperCount === numPlayers || scissorCount === numPlayers) {
      let winningType;
      if (rockCount > 0) {
        winningType = 'rock';
      } else if (paperCount > 0) {
        winningType = 'paper';
      } else {
        winningType = 'scissors';
      }

      console.log("WINNER! ", winningType);
      this.physics.pause(); // Stop physics updates
      this.scene.start('EndScreen', {'winner': winningType});
    }
  }

  // Helper function to get the group a sprite belongs to
  getSpriteGroup(sprite) {
    // Look for the sprite in rock, paper, and scissors groups
    if (this.rocks.children.entries.includes(sprite)) {
      return this.rocks;
    } else if (this.papers.children.entries.includes(sprite)) {
      return this.papers;
    } else if (this.scissors.children.entries.includes(sprite)) {
      return this.scissors;
    } else {
      // Handle error if sprite isn't in any group
    }
  }
}

if (window.innerHeight > window.innerWidth)
{
  var height = 2560;
  var width = 1440;
}
else
{
  var width = 2560;
  var height = 1440;
}

var config = {
  type: Phaser.AUTO,
  width: width,
  height: height,
  // Sets game scaling
  scale: {
    // Fit to window
    mode: Phaser.Scale.FIT,
    // Center vertically and horizontally
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: 'landscape', // Set the orientation to landscape
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
      // debugShowBody: true,
      // debugShowStaticBody: true,
      // debugShowVelocity: true,
      // debugVelocityColor: 0xffff00,
      // debugBodyColor: 0x0000ff,
      // debugStaticBodyColor: 0xffffff,
      gravity: 0 // Disable gravity for top-down movement
    }
  },
  scenes:
  {
    StartScreen: StartScreen,
    EndScreen: EndScreen,
    Game: Game,
  },
  scene: [StartScreen, Game, EndScreen],
};

var game = new Phaser.Game(config);
