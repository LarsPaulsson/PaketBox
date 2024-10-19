const STATE_PAUSE=0;
const STATE_STARTING=1;
const STATE_SELECTING=2;
const STATE_PAYING=3;
const STATE_DELIVER=4;
const STATE_FINISH=5;
const MSG_NEXT=90;
const MSG_LOADED=91;

let product1 = { number:1, name:"Vete", price:4.5, volume:10, pulses: 5 };
let product2 = { number:2, name:"Fågelfrö", price:5.5, volume:10, pulses: 10 };
let product3 = { number:3, name:"Majs", price:3.8, volume:10, pulses: 7 };
let product4 = { number:4, name:"Havre", price:3.9, volume:10, pulses: 6 };
let prods=[product1,product2,product3,product4];
let productindex=0;
let productnow=prods[productindex];

function sendup(m) {
    const jsonString = JSON.stringify(m);
    parent.postMessage(jsonString, '*');
    // parentwindow.postMessage(jsonString, '*');
  }
