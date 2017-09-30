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

const randomize = <T>(arr: { value: T, weight: number }[]) => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0, len = arr.length; i < len; i++) {
        cumulative += arr[i].weight;
        if (cumulative >= rand) {
            return arr[i].value;
        }
    }
    return arr[arr.length - 1].value
};

const collides = (sprite: PIXI.Sprite, graphics: PIXI.Graphics) => {
    const vertices = sprite.vertexData;
    for (let i = 0, len = vertices.length; i < len; i += 2) {
        const point = new PIXI.Point(vertices[i], vertices[i + 1]);
        if (graphics.containsPoint(point)) return true;
    }
    return false;
};

const displayScores = () => {
    const stored = localStorage.getItem('scores');
    const scores = stored ? JSON.parse(stored) : [];
    document.getElementById('scores').innerHTML = `
        <ol>${scores.map(s => `<li><b>${s}</b></li>`).join('')}</ol>
    `;
}

const saveScore = (score: number) => {
    const stored = localStorage.getItem('scores');
    const scores = stored ? JSON.parse(stored) : [];
    if (score > scores[scores.length - 1]) {
        if (scores.length >= 10) scores.pop();
        scores.push(score);
        scores.sort((a, b) => b - a);
        localStorage.setItem('scores', JSON.stringify(scores));
    }
    displayScores();
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const start = (cb) => {
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

    let lastCalledTime;
    let fps;

    let isMousePressed = false;

    addEventListener('mousedown', () => isMousePressed = true);
    addEventListener('mouseup', () => isMousePressed = false);

    displayScores();
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

    const obstacleWeights: { value: typeof Obstacle, weight: number }[] = [
        { value: Gate, weight: 0.6 },
        { value: MovingGate, weight: 0.3 },
        { value: Maze, weight: 0.1 },
    ];

    const getObstacle = () => {
        const ObstacleClass = randomize(obstacleWeights);
        const obstacle = new ObstacleClass();
        obstacle.draw();
        return obstacle;
    };

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

        document.getElementById('message').innerText = '';

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

    let framesToCalculate = 20;

    function gameLoop() {
        if (framesToCalculate > 0) {
            if (!lastCalledTime) {
                lastCalledTime = Date.now();
                fps = 0;
            }
            const delta = (Date.now() - lastCalledTime) / 1000;
            lastCalledTime = Date.now();
            fps = 1 / delta;

            ddy = 0.4 * 60 / fps;
            framesToCalculate--;
        }

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
        state = noop;
        document.getElementById('message').innerText = 'Game Over.';
        saveScore(player.score);
        cb();
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
    return start(() => {
        const un = addEventListener('keyup', () => {
            const un2 = addEventListener('keydown', () => {
                render();
                un2();
            });
            un();
        });
    });
};

export default render;