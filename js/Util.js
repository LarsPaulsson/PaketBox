const STATE_PAUSE=0;
const STATE_STARTING=1;
const STATE_SELECTING=2;
const STATE_PAYING=3;
const STATE_DELIVER=4;
const STATE_FINISH=5;
const STATE_USECASE1=6;
const STATE_USECASE2=7;
const MSG_NEXT=90;
const MSG_LOADED=91;

let product1 = { number:1, name:"Vete", price:5.0, volume:1000, pulses: 5, image:"img/vete.jpg"};
let product2 = { number:2, name:"Fågelfrö", price:5.5, volume:100, pulses: 10, image:"img/fågelfrö.jpg" };
let product3 = { number:3, name:"Majs", price:3.8, volume:500, pulses: 7, image:"img/majs.jpg" };
let product4 = { number:4, name:"Havre", price:3.9, volume:2000, pulses: 6, image:"img/havre.jpg" };
let product5 = { number:0, name:"QRkoder", price:0, volume:20, pulses: 6, image:"img/qr.png" };
let product6 = { number:0, name:"QRkoder", price:0, volume:20, pulses: 6, image:"img/qr.png" };
// let prods=[product1,product2,product3,product4,product5,product6];
let prods=[product1,product2,product3,product4];
let productindex=0;
let productnow=prods[productindex];

function sendup(m) {
    const jsonString = JSON.stringify(m);
    parent.postMessage(jsonString, '*');
    // parentwindow.postMessage(jsonString, '*');
  }


  // För test, se SwishSimple.htm
  // Doc https://developer.swish.nu/documentation/guides/generate-qr-codes
  // https://app.swish.nu/1/p/sw/?sw=46701234567
  // https://app.swish.nu/1/p/sw/?sw=1231561596&amt=170.0
  // https://app.swish.nu/1/p/sw/?sw=46701234567&amt=170.0&msg=Hot%20Dog
  // https://app.swish.nu/1/p/sw/?sw=46701234567&amt=170.0&edit=amt
  // https://app.swish.nu/1/p/sw/?sw=46701234567&amt=170.0&msg=Hot%20Dog&edit=amt,msg
  // https://app.swish.nu/1/p/sw/?sw=46701234567&amt=170.0&msg=Hot%20Dog&edit=msg
  // använder <script src="js/qrcode.js">
  // https://app.swish.nu/1/p/sw/?sw=0705152540&amt=1&cur=SEK&msg=L1&src=qr
  // generateSwishQrCode("qr-code", phone2, 1, "Hejsan", 200, 0);
  // generateSwishQrCode("qr-code2", phone2, 1, "Hejsan", 300, 1);
  
  let phone1="0705152540"
  let phone2="0760530601";
  /*
  let amt="1";
  let swmsg="S1Ostlunda";
  */
  function generateSwishQrCode(idDestination, phone, amt, swmsg, w, mode) {
    // mode 1 är med webblänk
    let qrContent;
    if (mode==0) qrContent="C"+phone2+";"+amt+";"+swmsg+";0";     // Liten, utan url, 0 sist ger utan möjlighet att ändra något
    else  qrContent="https://app.swish.nu/1/p/sw/?sw="+phone+"&amt="+amt+"&cur=SEK&msg="+swmsg+"&src=qr";
    const qrobj= new QRCode(idDestination, {
         text: qrContent,
         width:w, height: w,
         colorDark: "#000000", colorLight: "#ffffff",
         correctLevel: QRCode.CorrectLevel.H,
        });
    }
  
    function SwishQRorNavigate(idDestination, phone, amt, swmsg, w, mode) {
      let qrContent;
      qrContent="https://app.swish.nu/1/p/sw/?sw="+phone+"&amt="+amt+"&cur=SEK&msg="+swmsg+"&src=qr";
      const isMobileDevice = window.navigator.userAgent.toLowerCase().includes("mobi");
      if (isMobileDevice) {
      // if(window.navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/)) {
        // i mobil
          // window.open(qrContent, '_blank');
          window.location.href = qrContent;
      } else {
        // i dator
           const qrobj= new QRCode(idDestination, {
           text: qrContent,
           width:w, height: w,
           colorDark: "#000000", colorLight: "#ffffff",
           correctLevel: QRCode.CorrectLevel.H,
          });
        }
      }

      
/* View in fullscreen */
function openFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function closeFullscreen() {
  var elem = document.documentElement;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}