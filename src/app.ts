import * as PIXI from 'pixi.js';

const eventHandlers: { eventName: string, handler: any }[] = [];

const addEventListener = (eventName: string, handler: any, ...args) => {
    window.addEventListener(eventName, handler, ...args);
    eventHandlers.push({ eventName, handler });
    return () => window.removeEventListener(eventName, handler);
}

const removeAllEventListener = () => {
    eventHandlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
    });
};

const reset = () => {
    document.getElementById('App').innerHTML = '';
    removeAllEventListener();
};

const randomize = <T>(arr: { obstacle: T, weight: number }[]) => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0, len = arr.length; i < len; i++) {
        cumulative += arr[i].weight;
        if (cumulative >= rand) {
            return arr[i].obstacle;
        }
    }
    return arr[arr.length - 1].obstacle
};

interface Collidable {
    x: number;
    y: number;
    height: number;
    width: number;
}

const collides = (sprite: PIXI.Sprite, graphics: PIXI.Graphics) => {
    const vertices = sprite.vertexData;
    for (let i = 0, len = vertices.length; i < len; i += 2) {
        const point = new PIXI.Point(vertices[i], vertices[i + 1]);
        if (graphics.containsPoint(point)) return true;
    }
    return false;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const start = () => {
    const Container = PIXI.Container,
        autoDetectRenderer = PIXI.autoDetectRenderer,
        loader = new PIXI.loaders.Loader(),
        resources = loader.resources,
        TextureCache = PIXI.utils.TextureCache,
        Texture = PIXI.Texture,
        Sprite = PIXI.Sprite,
        Text = PIXI.Text,
        Graphics = PIXI.Graphics;

    const width = 400, height = 800;

    let y = 0.0;
    let dy = 0.0;
    let ddy = 0.4;
    let dim = 40.0;
    let max_dy = 50.0;
    let hole = width / 4;

    let isMousePressed = false;

    addEventListener('mousedown', () => isMousePressed = true);
    addEventListener('mouseup', () => isMousePressed = false);

    //Create a Pixi stage and renderer and add the 
    //renderer.view to the DOM
    const stage = new Container(),
        renderer = autoDetectRenderer(width, height);

    document.getElementById('App').appendChild(renderer.view);

    loader
        .add("images/rocket.png")
        .load(setup);

    class Obstacle extends Graphics {
        points = 1;
        drawEveryFrame = false;
        passed = false;
        draw() {
            this.clear();
        }
    }

    class Gate extends Obstacle {
        private gateHeight = dim;
        private holeWidth = hole;
        protected holePosition = random(this.holeWidth / width / 2, 1 - this.holeWidth / width / 2);

        draw() {
            super.draw();
            this.beginFill(0xffffff);
            this.drawRect(
                0,
                -this.gateHeight,
                width * this.holePosition - this.holeWidth / 2,
                this.gateHeight
            );
            this.drawRect(
                width * this.holePosition + this.holeWidth / 2,
                -this.gateHeight,
                width * (1 - this.holePosition) - this.holeWidth / 2,
                this.gateHeight
            );
            this.endFill();
        }
    }

    class MovingGate extends Gate {
        private holeSpeed = hole / width / 20;
        drawEveryFrame = true;

        points = 2;
        draw() {
            super.draw();
            if (this.holePosition > 1 - hole / width / 2) {
                this.holeSpeed *= -1;
            }
            if (this.holePosition < hole / width / 2) {
                this.holeSpeed *= -1;
            }
            this.holePosition += this.holeSpeed;
            super.draw();
        }
    }

    class Maze extends Obstacle {
        points = 3;
        private gateHeight = dim;
        private holeWidth = hole;

        private lowerHolePosition = 0.25;
        private upperHolePosition = 0.75;
        private spaceBetween = dim * 7;
        private middleHolePosition = random(this.holeWidth / this.spaceBetween / 2, 1 - this.holeWidth / this.spaceBetween / 2);

        draw() {
            super.draw();
            this.beginFill(0xffffff);
            this.drawRect(
                0,
                -this.gateHeight,
                width * this.lowerHolePosition - this.holeWidth / 2,
                this.gateHeight
            );
            this.drawRect(
                width * this.lowerHolePosition + this.holeWidth / 2,
                -this.gateHeight,
                width * (1 - this.lowerHolePosition) - this.holeWidth / 2,
                this.gateHeight
            );
            this.drawRect(
                0,
                -2 * this.gateHeight - this.spaceBetween,
                width * this.upperHolePosition - this.holeWidth / 2,
                this.gateHeight
            );
            this.drawRect(
                width * this.upperHolePosition + this.holeWidth / 2,
                -2 * this.gateHeight - this.spaceBetween,
                width * (1 - this.upperHolePosition) - this.holeWidth / 2,
                this.gateHeight
            );
            this.drawRect(
                (width - this.gateHeight) / 2,
                -this.gateHeight - (this.spaceBetween * this.middleHolePosition - this.holeWidth / 2),
                this.gateHeight,
                this.spaceBetween * this.middleHolePosition - this.holeWidth / 2,
            );
            this.drawRect(
                (width - this.gateHeight) / 2,
                -this.gateHeight - this.spaceBetween,
                // -this.gateHeight - (this.spaceBetween * this.middleHolePosition - this.holeWidth / 2),
                this.gateHeight,
                this.spaceBetween * (1 - this.middleHolePosition) - this.holeWidth / 2,
            );
            // this.drawRect(
            //     (width - this.gateHeight) / 2,
            //     -this.gateHeight - this.spaceBetween,
            //     this.gateHeight,
            //     (this.spaceBetween - this.holeWidth) * (1 - this.middleHolePosition),
            // );
            this.endFill();
        }
    }

    class Player extends Sprite {

        private dx = 0;
        private ddx = 0.25;

        score = 0;

        rotation = 0;

        left() {
            this.dx -= this.ddx;
        }

        right() {
            this.dx += this.ddx;
        }

        move() {
            this.dx *= 0.98;
            this.x += this.dx;
            let newRotation = Math.PI / 2 - Math.atan2(dy, this.dx);
            if (Math.abs(Math.abs(newRotation - this.rotation) - Math.PI) > 1e-8) {
                this.rotation = newRotation;
            }
        }

        constructor(sprite: PIXI.Texture) {
            super(sprite);
            this.x = width / 2 - 10;
            this.y = height - 100;
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
        }
    }

    const obstacleWeights: { obstacle: typeof Obstacle, weight: number }[] = [
        { obstacle: Gate, weight: 0.6 },
        { obstacle: MovingGate, weight: 0.3 },
        { obstacle: Maze, weight: 0.1 },
    ]

    const getObstacle = () => {
        const ObstacleClass = randomize(obstacleWeights);
        const obstacle = new ObstacleClass();
        obstacle.draw();
        return obstacle;
    }

    function noop() { }

    //Define variables that might be used in more 
    //than one function
    let state: Function = noop, gameScene: PIXI.Container;
    const obstacles: Obstacle[] = [];
    let player: Player;
    let score: PIXI.Text;

    const addObstacle = () => {
        const obstacle = getObstacle();
        obstacles.push(obstacle);
        gameScene.addChild(obstacle);

        return obstacle;
    };

    const addPlayer = (sprite) => {
        player = new Player(sprite);
        gameScene.addChild(player);
        return player;
    };

    const addScore = () => {
        score = new PIXI.Text('Score: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xff1010,
            align: 'center'
        });
        score.x = 20;
        score.y = 20;
        gameScene.addChild(score);
    };

    const left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40),
        enter = keyboard(13),
        space = keyboard(32);

    function setup() {
        //Make the game scene and add it to the stage
        gameScene = new Container();
        stage.addChild(gameScene);

        addObstacle();
        addPlayer(resources["images/rocket.png"].texture);
        addScore();


        left.press = function () {

        };
        left.release = function () {
        };
        up.press = function () {
        }
        up.release = function () {
        };
        right.press = function () {

        };
        right.release = function () {
        };
        down.press = function () {
        };
        down.release = function () {
        };
        enter.press = function () {
            state = noop;
        };
        enter.release = function () {
        };
        space.press = function () {
        };
        space.release = function () {
        };

        const un = addEventListener('keydown', () => {
            state = play;
            un();
        });

        gameLoop();
    }

    function gameLoop() {
        //Loop this function 60 times per second
        requestAnimationFrame(gameLoop);
        //Update the current game state
        state();
        //Render the stage
        renderer.render(stage);
    }

    function play() {

        if (space.isDown || enter.isDown) {
            if (dy < max_dy) {
                dy += (1 - dy / (max_dy - dy)) * ddy;
            }
        } else {
            if (dy > -max_dy) {
                dy -= (1 - dy / (-max_dy - dy)) * ddy;
            }
        }

        if (left.isDown) {
            player.left();
        } else if (right.isDown) {
            player.right();
        }

        const prevY = player.y;
        player.move();

        for (let i = 0, len = obstacles.length; i < len; i++) {
            const obstacle = obstacles[i];

            if (obstacle.drawEveryFrame) {
                obstacle.draw();
            }

            obstacle.y += dy;

            if (collides(player, obstacle)) {
                state = end;
                break;
            }

            if (!obstacle.passed && obstacle.y - obstacle.height > player.y) {
                obstacle.passed = true;
                player.score += obstacle.points;
                score.text = 'Score: ' + player.score;
            }
        }

        const lastObstacle = obstacles[obstacles.length - 1];

        if (lastObstacle.y - lastObstacle.height > height / 2) {
            addObstacle();
        }
    }

    function end() {
        document.getElementById('message').innerText = 'Game Over.';
        state = noop;
    }

    /* Helper functions */
    function contain(sprite, container) {
        let collision = undefined;
        //Left
        if (sprite.x < container.x) {
            sprite.x = container.x;
            collision = "left";
        }
        //Top
        if (sprite.y < container.y) {
            sprite.y = container.y;
            collision = "top";
        }
        //Right
        if (sprite.x + sprite.width > container.width) {
            sprite.x = container.width - sprite.width;
            collision = "right";
        }
        //Bottom
        if (sprite.y + sprite.height > container.height) {
            sprite.y = container.height - sprite.height;
            collision = "bottom";
        }
        //Return the `collision` value
        return collision;
    }
    //The `hitTestRectangle` function
    function hitTestRectangle(r1, r2) {
        //Define the variables we'll need to calculate
        let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
        //hit will determine whether there's a collision
        hit = false;
        //Find the center points of each sprite
        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width / 2;
        r2.centerY = r2.y + r2.height / 2;
        //Find the half-widths and half-heights of each sprite
        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;
        //Calculate the distance vector between the sprites
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;
        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = r1.halfWidth + r2.halfWidth;
        combinedHalfHeights = r1.halfHeight + r2.halfHeight;
        //Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {
            //A collision might be occuring. Check for a collision on the y axis
            if (Math.abs(vy) < combinedHalfHeights) {
                //There's definitely a collision happening
                hit = true;
            } else {
                //There's no collision on the y axis
                hit = false;
            }
        } else {
            //There's no collision on the x axis
            hit = false;
        }
        //`hit` will be either `true` or `false`
        return hit;
    };
    //The `randomInt` helper function
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }




    //The `keyboard` helper function
    function keyboard(keyCode: number) {
        const key: {
            code: number,
            isDown: boolean,
            isUp: boolean,
            press?: Function,
            release?: Function,
            downHandler?: Function,
            upHandler?: Function
        } = {
                code: keyCode,
                isDown: false,
                isUp: true,
            };
        //The `downHandler`
        key.downHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            // event.preventDefault();
        };
        //The `upHandler`
        key.upHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isDown && key.release) key.release();
                key.isDown = false;
                key.isUp = true;
            }
            // event.preventDefault();
        };
        //Attach event listeners
        addEventListener(
            "keydown", key.downHandler.bind(key), false
        );
        addEventListener(
            "keyup", key.upHandler.bind(key), false
        );

        return key;
    }

    return () => state = noop;

};

const render = () => {
    reset();
    return start();
};

export default render;