const STATE_PAUSE=0;
const STATE_STARTING=1;
const STATE_SELECTING1=2;
const STATE_SELECTING2=3;
const STATE_PAYING=4;
const STATE_DELIVER=5;
const STATE_FINISH=6;
const MSG_NEXT=90;
const MSG_LOADED=91;


function sendup(m) {
    const jsonString = JSON.stringify(m);
    parent.postMessage(jsonString, '*');
    // parentwindow.postMessage(jsonString, '*');
  }
