var lastFrameTime = Date.now() / 1000;
var canvas;
var shader;
var batcher;
var gl;
var mvp = new spine.webgl.Matrix4();
var skeletonRenderer;
var debugRenderer;
var debugShader;
var shapes;
window.skeleton = {};
var activeSkeleton = "";
var speedFactor = 1;
var bgColor = [1.0, 1, 1, 1];

var keyPressed = false;



var spriteShader;

function getClass(i){
    return (i < 10 ? '0' : '') + i;
}

function loadData(url, cb, loadType, progress) {
    console.log(url);
    var xhr = new XMLHttpRequest;
    xhr.open('GET', url, true);
    if (loadType) xhr.responseType = loadType;
    if (progress) xhr.onprogress = progress;
    xhr.onload = function () {
        if (xhr.status == 200)
            cb(true, xhr.response);
        else
            cb(false);
    }
    xhr.onerror = function () {
        cb(false);
    }
    xhr.send();
}

function sliceCyspAnimation(buf) {
    var view = new DataView(buf), count = view.getInt32(12, true);
    return {
        count: count,
        data: buf.slice((count + 1) * 32)};
}

function init() {
    canvas = document.getElementById("canvas");
    var config = { alpha: false };
    gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
    if (!gl) {
        alert('WebGL is unavailable.');
        return;
    }


    keyMap = {};
    document.addEventListener('keydown', function(event) {
        if(keyMap[event.code] === true ) return;

        if(event.code === 'ArrowRight' ){
            runChar( false);
        }
        else if (event.code === 'ArrowLeft'){
            runChar( true);
        }
        // else if (event.code === 'KeyA'){
        //     attackChar();
        // }
        // else if (event.code === 'KeyS'){
        //     attack2Char();
        // }

        // else if (event.code === 'KeyQ'){
        //     dieChar( );
        // }
        // else if (event.code === 'KeyW'){
        //     damageedChar();
        // }

        // else if (event.code === 'KeyZ'){
        //     useSkill( 0);
        // }
        // else if (event.code === 'KeyX'){
        //     useSkill( 1);
        // }
        // else if (event.code === 'KeyC'){
        //     useSkill( 2);
        // }


       // console.log(event.code)
        if( event.code === 'Space'){
            jumpChar();
        }

        keyMap[event.code] = true;
        //    keyPressed = true;

    }, false);

    document.addEventListener('keyup', function(event) {

        // if(event.code === 'ArrowRight'){
        //     stopChar();
        // }
        // else if (event.code === 'ArrowLeft'){
        //     stopChar();
        // }

        keyMap[event.code] = false;

    }, false);

    // // Create a simple shader, mesh, model-view-projection matrix and SkeletonRenderer.


    initSpineGL();

    

    TextureUtil.loadTexture( function(){
        loadSpine(characterID, classID);
    })
}



var groundPos = 0;
var bgPos = 0;
var adjustHeight;
function render() {

    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;
    lastFrameTime = now;
    delta *= speedFactor;
    // Update the MVP matrix to adjust for canvas size changes
    resize();
    adjustHeight = canvas.height / 2 - 100;

    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);


    SpriteShader.bind();

    SpriteShader.setTexture("bg.jpg");

    bgPos -= delta * 50;
    if( bgPos <= -1024 )
    bgPos = 0;

    for( var i = 0; i < 4 ; i++ ){
        SpriteShader.setLocation(i * 1024 + bgPos, -512 + adjustHeight);
        SpriteShader.draw();
    }

    groundPos -= delta * 200;
    if( groundPos <= -512 )
        groundPos = 0;


    SpriteShader.setTexture("ground.png");
    for( var i = 0; i < 6 ; i++ ){
        SpriteShader.setLocation(i * 512 + groundPos, adjustHeight);
        SpriteShader.draw();
    }

    SpriteShader.setTexture("tree.png");
    for( var i = 0; i < 6 ; i++ ){
        SpriteShader.setLocation(i * 512 + groundPos,adjustHeight);
        SpriteShader.draw();
    }




    spineRender(delta, false);

    requestAnimationFrame(render);
}

var movement = 0;





function resize() {
    var w = canvas.clientWidth * devicePixelRatio;
    var h = canvas.clientHeight * devicePixelRatio;
    var bounds = window.skeleton.bounds;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    // magic
    var centerX = 0;//bounds.offset.x + bounds.size.x / 2;
    var centerY = 0;//bounds.offset.y + bounds.size.y / 2;
    var scaleX = 1;//bounds.size.x / canvas.width;
    var scaleY = 1;//bounds.size.y / canvas.height;
    var scale = 2;//Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    var width = canvas.width * scale;
    var height = canvas.height * scale;

    mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

//endregion


function runChar(isLeft ){
    if(isLeft === false)
        movement = 4;
    else
        movement = -4;
    var run = {
        animName : 'run',
        isLoop : true,
        timeScale : 1
    };

    runAnimation([run]);
}
function stopChar(){
    movement = 0;

    var idle = {
        animName : 'idle',
        isLoop : true,
        timeScale : 1
    };
    runAnimation([idle]);
}

function attackChar (){
    movement = 0;

    var idle = {
        animName : 'idle',
        isLoop : true,
        timeScale : 1
    };
    var attack_skipQuest = {
        animName : 'attack_skipQuest',
        isLoop : false,
        timeScale : 1
    };

    runAnimation([attack_skipQuest, idle]);
}

function attack2Char (){
    movement = 0;
    var idle = {
        animName : 'idle',
        isLoop : true,
        timeScale : 1
    };
    var attack = {
        animName : 'attack',
        isLoop : false,
        timeScale : 2
    };
    runAnimation([attack, idle]);
}

function damageedChar (){
    movement = 0;
    var idle = {
        animName : 'idle',
        isLoop : true,
        timeScale : 1
    };
    var damage = {
        animName : 'damage',
        isLoop : false,
        timeScale : 1
    };
    runAnimation([damage, idle]);
}

function jumpChar (){
    var idle = {
        animName : 'run',
        isLoop : true,
        timeScale : 1
    };
    var damage = {
        animName : '000000_run_highJump',
        isLoop : false,
        timeScale : 1
    };
    runAnimation([damage, idle]);
}

function dieChar(){
    movement = 0;
    var stop = {
        animName : 'stop',
        isLoop : false,
        timeScale : 1
    };
    var die = {
        animName : 'die',
        isLoop : false,
        timeScale : 1
    };
    runAnimation([die, stop]);
}

function useSkill(index){
    var characterSkillDataID = Math.floor(characterID / 100) * 100 + 1;

    var skill = {
        animName : characterSkillDataID + '_skill' + index,
        isLoop : false,
        timeScale : 1.5
    };
    var idle = {
        animName : 'idle',
        isLoop : true,
        timeScale : 1
    };

    runAnimation([skill, idle] );
}

function runAnimation( animArray ){

    var firstActionObj =  animArray.shift();
    var firstAction = firstActionObj.animName;

    firstAction = setAnimName(firstAction);

    var AnimEntry = window.skeleton.state.setAnimation(0, firstAction, firstActionObj.isLoop);
    AnimEntry.timeScale = firstActionObj.timeScale;
    animationQueue.length = 0;
    animArray.forEach( function(i){
        animationQueue.push( i.animName);
    })

}