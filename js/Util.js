const STATE_PAUSE=0;
const STATE_STARTING=1;
const STATE_SELECTING=2;
const STATE_PAYING=3;
const STATE_DELIVER=4;
const STATE_FINISH=5;
const MSG_NEXT=90;
const MSG_LOADED=91;

let product1 = { number:1, name:"Vete", price:50.0, volume:1000, pulses: 5, image:"img/vete.jpg"};
let product2 = { number:2, name:"Fågelfrö", price:5.5, volume:100, pulses: 10, image:"img/fågelfrö.jpg" };
let product3 = { number:3, name:"Majs", price:3.8, volume:500, pulses: 7, image:"img/majs.jpg" };
let product4 = { number:4, name:"Havre", price:3.9, volume:2000, pulses: 6, image:"img/havre.jpg" };
let product5 = { number:4, name:"Efterrätt", price:100, volume:20, pulses: 6, image:"img/desert.jpg" };
let prods=[product1,product2,product3,product4,product5];
let productindex=0;
let productnow=prods[productindex];

function sendup(m) {
    const jsonString = JSON.stringify(m);
    parent.postMessage(jsonString, '*');
    // parentwindow.postMessage(jsonString, '*');
  }
