/**
* Made with q5!
* https://q5js.org
*/
import * as type from 'https://cdn.jsdelivr.net/npm/opentype.js@2.0.0/dist/opentype.mjs';

await Canvas();
angleMode(degrees)
let goodness; //score for overlay

let circleAX;
let circleAY;
let circleBX;
let circleBY;

let lengthA1; // the first segment on A (red one)
let lengthA2;
let lengthB1;
let lengthB2;

let targetX;
let targetY;

let angleA; // the angle of the first segment from A
let angleB;

let nodeAX;
let nodeAY;
let nodeBX;
let nodeBY;

const textInput = createInput()
const addText = createButton('add text')
const fontUpload = createInput(false, 'file')
const fontsArray = [] // list of fonts as opentype font objects with their names
const textStrings = [] //not the points, just the info about each string
const paths = []
const fontDropdown = document.createElement('select') //q5 createSelect was not working
const generateButton = createButton('make path')

const aCC = createCheckbox(); // should segments a go counterclockwise
const bCC = createCheckbox('',true);
const definitenessOverlay = createCheckbox()
const betterOverlay = createCheckbox()
const precisionOverlay = createCheckbox()
const betterPrecisionOverlay = createCheckbox()
const nodesOverlay = createCheckbox()
const fineness = createSlider(3,32,4,0.5); // anything less than ~3 for a ~1000x1000 grid is super slow

const lengthA1Input = createInput(350,'number'); // I know this is dumb but i had some problem and didn't want to debug it
const lengthA2Input = createInput(350,'number');
const lengthB1Input = createInput(350,'number');
const lengthB2Input = createInput(350,'number');

const circleAXInput = createInput(0,'number'); // I know this is dumb but i had some problem and didn't want to debug it
const circleAYInput = createInput(-300,'number');
const circleBXInput = createInput(0,'number');
const circleBYInput = createInput(300,'number');

const precisionTuner = createSlider(0,2,1,0.00001)
const interactiveMode = createCheckbox('',true)
const photoMode = createCheckbox()
const anglesArray = [];

lengthA1Input.position(width-100,0).size(100).title = 'Segment A1 length'
lengthA2Input.position(width-100,20).size(100).title = 'Segment A2 length'
lengthB1Input.position(width-100,40).size(100).title = 'Segment B1 length'
lengthB2Input.position(width-100,60).size(100).title = 'Segment B2 length'

circleAXInput.position(width-100,80).size(100).title = 'Circle A X coord'
circleAYInput.position(width-100,100).size(100).title = 'Circle A Y coord'
circleBXInput.position(width-100,120).size(100).title = 'Circle B X coord'
circleBYInput.position(width-100,140).size(100).title = 'Circle B Y coord'

aCC.position(width-104,160).title = 'Red counterclockwise?'
bCC.position(width-92,160).title = 'Blue counterclockwise?'

definitenessOverlay.position(width-12,160).title = 'weird overlay... shows distance between nodes to help find bad points'
betterOverlay.position(width-24,160).title = 'shows angle between nodes to help find bad spots'
precisionOverlay.position(width-36,160).title = 'intended to show how much changing the position affects an angle to indicate how accurate it would be'
betterPrecisionOverlay.position(width-48,160).title = 'Also meant to show how much changing the position affects an angle to indicate how accurate it would be'
nodesOverlay.position(width-60,160).title = 'Just shows the x coordinates of the nodes for each position in red/blue'

fineness.position(width-100,180).title = 'how coarse the overlays are. right is coarser=less lag'
precisionTuner.position(width-100,200).title = 'adjusts bounds for one of the overlays'

photoMode.position(width-20, height-20).title = 'hide linkage stuff'
interactiveMode.position(width-40, height-20).title = 'interactive mode'

textInput.position(width-100,240).size(100)
fontUpload.position(width-100,260).setAttribute("accept",".ttf,.woff,.otf")
fontUpload.style.opacity = 0;
fontUpload.id = "font-upload"
fontDropdown.style.position = 'fixed'
fontDropdown.style.left = `${width-100}px`
fontDropdown.style.top  = '300px'

const buffer = fetch('NotoSans-Regular.ttf').then(res => res.arrayBuffer()); //preload roboto
buffer.then(data => {
  fontsArray.push([type.parse(data),'Broken feature - it doesnt work yet']) //Noto Sans
  const newOption = document.createElement('option')
  newOption.textContent = fontsArray.at(-1)[1]
  newOption.value = 0
  fontDropdown.appendChild(newOption)
  document.body.appendChild(fontDropdown);
})

function newFont() { //takes the user uploaded font and adds it to the fonts array alongside its filename
  const buffer = document.getElementById('font-upload').files[0].arrayBuffer();
  buffer.then(data => {
    fontsArray.push([type.parse(data),document.getElementById('font-upload').files[0].name])
    const newOption = document.createElement('option')
    newOption.textContent = fontsArray.at(-1)[1]
    newOption.value = fontsArray.length-1
    fontDropdown.appendChild(newOption)
    document.body.appendChild(fontDropdown);
  })
}
fontUpload.addEventListener("change", newFont);

addText.position(width-100,280).size(100).addEventListener('click', () => {
  textStrings.push([textInput.value,fontsArray[fontDropdown.value],0,0,72,0]) //Make a simple array which has ['text', font object, topleft x, y, size, angle] <- 0 is straight, 90 is up. size is in pixels
  textInput.value = ''
});

generateButton.position(width-100,320).size(100).addEventListener('click', generatePaths);

function setArmPositions(x,y) {
  angleA = acos((sqrt((circleAX - x) ** 2 + (circleAY - y) ** 2) ** 2 + lengthA1 ** 2 - lengthA2 ** 2) / (2 * sqrt((circleAX - x) ** 2 + (circleAY - y) ** 2) * lengthA1))
  if (aCC.checked){
    angleA = atan((x - circleAX) / (y - circleAY)) - angleA 
  } else{
    angleA = atan((x - circleAX) / (y - circleAY)) + angleA
  }
  if (y<circleAY){
    angleA=180+angleA;
  }
  angleB = acos((sqrt((circleBX - x) ** 2 + (circleBY - y) ** 2) ** 2 + lengthB1 ** 2 - lengthB2 ** 2) / (2 * sqrt((circleBX - x) ** 2 + (circleBY - y) ** 2) * lengthB1)) //TODO: figure our why i needed to subtract the angle and add 180...
  if (bCC.checked){
    angleB = atan((x - circleBX) / (y - circleBY)) - angleB 
  } else{
    angleB = atan((x - circleBX) / (y - circleBY)) + angleB
  }
  if (y<circleBY){
    angleB=180+angleB;
  }
  nodeAX = circleAX+(lengthA1*sin(angleA));
  nodeAY = circleAY+(lengthA1*cos(angleA));
  nodeBX = circleBX+(lengthB1*sin(angleB));
  nodeBY = circleBY+(lengthB1*cos(angleB));
}

function pathToPoints(path,x,y,scale,angle,sampling){ // takes an svg style path (as a string) and converts it to key points (ie straight line is 2 pts but spline is several pts)
  //uh oh idk what to do here
}

function stringToPath(textString, font) {
  const path = font.getPath(textString,0,0,1)
  log(path.toPathData(6))
  const newPath = type.Path.fromSVG(path.toPathData(6))
  return path.toPathData(6)
}

function generatePaths() {
  //probably just call pathToPoints on all the paths [] but maybe format somethnig something
}

function drawOverlays() {
  noStroke()
  if (definitenessOverlay.checked){
    for (let x = -halfWidth; x <= halfWidth; x+=fineness.val()){
      for(let y = -halfHeight; y <= halfHeight; y+=fineness.val()){
        setArmPositions(x,y);
        goodness=norm(dist(nodeAX,nodeAY,nodeBX,nodeBY),0,lengthA2+lengthB2);
        fill(goodness**4,1-2*Math.abs(goodness-0.5)+goodness,goodness**4)//0->black=0,0,0 | 0.5->green=low,1,low | 1-> white = 1,1,1         
        square(x,y,fineness.val())
      }
    }
  } else if (betterOverlay.checked){
    for (let x = -halfWidth; x <= halfWidth; x+=fineness.val()){
      for(let y = -halfHeight; y <= halfHeight; y+=fineness.val()){
        setArmPositions(x,y);
        goodness=norm(acos((lengthA2 ** 2 + lengthB2 ** 2 - dist(nodeAX,nodeAY,nodeBX,nodeBY) ** 2) / (2 * lengthA2 * lengthB2)),0,180);
        fill(goodness,1-2*Math.abs(goodness-0.5)+goodness,goodness)//0->black=0,0,0 | 0.5->green=low,1,low | 1-> white = 1,1,1         
        square(x,y,fineness.val())
      }
    }
  } else if (nodesOverlay.checked) {
    for (let x = -halfWidth; x <= halfWidth; x+=fineness.val()){
      for(let y = -halfHeight; y <= halfHeight; y+=fineness.val()){
        setArmPositions(x,y);
        fill(norm(nodeBX,-halfWidth,halfWidth),0,norm(nodeAX,-halfWidth,halfWidth))
        square(x,y,fineness.val())
      }
    }
  } else if (precisionOverlay.checked){
    for (let x = -halfWidth; x <= halfWidth; x+=fineness.val()){
      anglesArray[x]=[]
      for(let y = -halfHeight; y <= halfHeight; y+=fineness.val()){
        anglesArray[x][y]=[]
        setArmPositions(x,y);
        anglesArray[x][y][0] = angleA;
        anglesArray[x][y][1] = angleB;
      }
    }
    for (let x = -halfWidth+fineness.val(); x <= halfWidth-fineness.val(); x+=fineness.val()){
      for(let y = -halfHeight+fineness.val(); y <= halfHeight-fineness.val(); y+=fineness.val()){
        goodness=norm(Math.abs((anglesArray[x][y][0]-anglesArray[x-fineness.val()][y][0])*(anglesArray[x-fineness.val()][y][0]-anglesArray[x][y-fineness.val()][0])*(anglesArray[x][y][0]-anglesArray[x-fineness.val()][y-fineness.val()][0])*(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y][0])*(anglesArray[x][y][0]-anglesArray[x][y+fineness.val()][0])*(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y+fineness.val()][0])*(anglesArray[x][y][0]-anglesArray[x-fineness.val()][y+fineness.val()][0])*(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y-fineness.val()][0])*(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y][1])*(anglesArray[x-fineness.val()][y][1]-anglesArray[x][y-fineness.val()][1])*(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y-fineness.val()][1])*(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y][1])*(anglesArray[x][y][1]-anglesArray[x][y+fineness.val()][1])*(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y+fineness.val()][1])*(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y+fineness.val()][1])*(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y-fineness.val()][1])/fineness.val()**16),0,precisionTuner.val()*0.000001)
        fill(goodness)
        square(x,y,fineness.val())
      }
    }
  } else if (betterPrecisionOverlay.checked){
    for (let x = -halfWidth; x <= halfWidth; x+=fineness.val()){
      anglesArray[x]=[]
      for(let y = -halfHeight; y <= halfHeight; y+=fineness.val()){
        anglesArray[x][y]=[]
        setArmPositions(x,y);
        anglesArray[x][y][0] = angleA;
        anglesArray[x][y][1] = angleB;
      }
    }
    for (let x = -halfWidth+fineness.val(); x <= halfWidth-fineness.val(); x+=fineness.val()){
      for(let y = -halfHeight+fineness.val(); y <= halfHeight-fineness.val(); y+=fineness.val()){
        goodness=norm(Math.abs(Math.abs(anglesArray[x][y][0]-anglesArray[x-fineness.val()][y][0])+Math.abs(anglesArray[x-fineness.val()][y][0]-anglesArray[x][y-fineness.val()][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x-fineness.val()][y-fineness.val()][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x][y+fineness.val()][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y+fineness.val()][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x-fineness.val()][y+fineness.val()][0])+Math.abs(anglesArray[x][y][0]-anglesArray[x+fineness.val()][y-fineness.val()][0])+Math.abs(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y][1])+Math.abs(anglesArray[x-fineness.val()][y][1]-anglesArray[x][y-fineness.val()][1])+Math.abs(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y-fineness.val()][1])+Math.abs(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y][1])+Math.abs(anglesArray[x][y][1]-anglesArray[x][y+fineness.val()][1])+Math.abs(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y+fineness.val()][1])+Math.abs(anglesArray[x][y][1]-anglesArray[x-fineness.val()][y+fineness.val()][1])+ Math.abs(anglesArray[x][y][1]-anglesArray[x+fineness.val()][y-fineness.val()][1])/(16*fineness.val()**16)),0,precisionTuner.val()*0.0000000000000000000000000000000000001)
        fill(goodness)
        square(x,y,fineness.val())
      }
    }
  } 
}

q5.draw = function () {
  
  if (textStrings.hasOwnProperty(1)){
    const stringKey = 0
    log(textStrings)
    pathToPoints(stringToPath(textStrings[stringKey][0],textStrings[stringKey][1][0]),textStrings[stringKey][2],textStrings[stringKey][3],textStrings[stringKey][4],textStrings[stringKey][5])
  }

  //One big challenge will be the svg manipulator- I need to be able to modify the svg paths by scale, position and angle.
  //I think I should save the base svg in one place, and the scale and etc. will be saved for actual use without risking damage to svgs 


  //Now I am successful in creating path objects using the string
  //I will make a new paths array each loop? or maybe whenever something changes

  lengthA1 = Number(lengthA1Input.value);
  lengthA2 = Number(lengthA2Input.value);
  lengthB1 = Number(lengthB1Input.value);
  lengthB2 = Number(lengthB2Input.value);
  circleAX = Number(circleAXInput.value);
  circleAY = Number(circleAYInput.value);
  circleBX = Number(circleBXInput.value);
  circleBY = Number(circleBYInput.value);
  background(0.9)
  drawOverlays()


  if (interactiveMode.checked){
    targetX = mouseX;
    targetY = mouseY;
  }
  
  if (!photoMode.checked){
    beginShape()
    vertex
    setArmPositions(targetX,targetY)
    noStroke();
    fill(255,0,0);
    circle(circleAX, circleAY,20);
    fill(0,0,255);
    circle(circleBX, circleBY, 20);
    fill(0,255,0);
    circle(targetX, targetY,20);
    stroke('black');
    strokeWeight(0.5);
    noFill()
    circle(circleAX, circleAY, (lengthA1+lengthA2)*2)
    circle(circleBX, circleBY, (lengthB1+lengthB2)*2)
    circle(nodeAX, nodeAY, lengthA2*2)
    circle(nodeBX, nodeBY, lengthB2*2)
    line(circleAX, circleAY, targetX, targetY);
    line(circleBX, circleBY, targetX, targetY);// direct lines
    stroke(255,255,0)
    strokeWeight(2)
    line(circleAX, circleAY, nodeAX, nodeAY)//segments 1
    line(circleBX, circleBY, nodeBX, nodeBY)
    line(nodeAX, nodeAY, targetX,targetY) //segments 2
    line(nodeBX, nodeBY, targetX, targetY)
    stroke(0)
    textWeight(2)
    textAlign(RIGHT,BOTTOM)
    textSize(16)
    noFill()
    text('Hover over parameters to see what they do... or just try them out!',halfWidth-100,-halfHeight+20)
  }
}
