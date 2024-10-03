    const MAXLEN_GLOBALBUFFER=100;

    let portstate=0;    // 0 not connected, 1 running
    let globalState=0;
    let globalBuffer='';
    let port;
    let reader;
    let inputDone;
    let outputDone;
    let inputStream;
    let outputStream;

    async function withTimeout(promise, timeout) {
        return Promise.race([
        promise,
        new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
        )
        ]);
    }

    const debuglevel=1000;

    function logg (l, v) {
        if (l < 10) p=`*`;
        else if (l==90) p=">";
        else if (l==91) p="<";
        else if (l==92) p="?";
        else if (l<100) p="!";
        else p="+";
        s=`${p}:${l} ${v}`;
        if (l<=debuglevel) showLogg (s);   // resides in html document
        console.log(s);

    }

    function showBuffer (v) {
        // output.textContent += v+'\n';
        logg(100,v);
    }


    // I vanlig webbrowser är serieporten skyddad av att användaren godkänner en första gång
    // så då behöver en första connect göras strax efter en "User Gesture"

    async function connectPort () {             // must be async because uses await
        if (port) {
            await disconnectPort();
            await delay(100);
        }
        r=await reconnectPort();
        if (r==0)  logg(100, "sp connected");
        else logg(r, "sp not connected, try manual connect")
    }

    // Automatic reconnect if lost, like usb is pulled out and reinserted
    async function reconnectPort () {             // must be async because uses await
        try {
            
            const ports = await navigator.serial.getPorts();
            const nports = ports.length;
            logg(1001,'sp connecting, ports='+nports); // spammar loggen
            if (nports==0) {
                logg(1019, "No serialports available");
                // return 9;
            }
            if(nports==1) {
                port=ports[0];      // No need to ask, try this
            }
            if (port==null) {       // If still no port
                logg(1010, 'port null:'+nports);
                try { port = await navigator.serial.requestPort(); } // Ask User for permission and select port
                catch (error) {return 6; }       //Probably needs User gesture
            }

            if (port==null) {
                logg(1008, "Serialport null");
                return 8;
            }
                // Ett bekymmer är att enheten resettas varje gång vi kommer hit.
                // Bra vid fel men hindrar navigering mellan sidor
                // FUNKAR INTE OM DENNA AKTIVERAS await port.setSignals({ dataTerminalReady: false });
                // FUNKAR INTE OM DENNA AKTIVERAS await port.setSignals({ requestToSend: false });
                await port.open({ baudRate: 9600 });

                const textDecoder = new TextDecoderStream();
                inputDone = port.readable.pipeTo(textDecoder.writable);
                inputStream = textDecoder.readable;

                reader = inputStream.getReader();


                const textEncoder = new TextEncoderStream();
                outputDone = textEncoder.readable.pipeTo(port.writable);
                outputStream = textEncoder.writable;

                portstatus=1;
                globalState=1;
                return 0;

            } catch (error) {
                logg (1007, error.message);
                return 7;
            }
    };


    // För test att återställa som om Serieporten vore ny
    async function disconnectAndForgetPort () {
        try {
        await disconnectPort();
        await port.forget;
        logg(100,'disconnectAndForget');
        } catch (err) {
        logg(9,'disconnectAndForget error='+err.message);
        }
    }

    async function disconnectPort () {
        globalState=-1;
        await delay(100);
        logg(100,'sp disconnect');
        portstatus=0;
        try {
            if (reader) {
                await reader.cancel();
                await inputDone.catch(() => {});
                reader = null;
                inputDone = null;
            }
            if (outputStream) {
                await outputStream.getWriter().close();
                await outputDone;
                outputStream = null;
                outputDone = null;
            }
            if (port) await port.close();
            // port = null;
        } catch (err) {
            logg(9,"Disconnect error="+err.message);
        }
        logg(100,'sp disconnect done');
    };

    async function sendtoPort (inputValue) {
    if (globalState<=0) {
        return 1;
    }

    try {
      const writer = outputStream.getWriter();
      await writer.write(inputValue+'\r\n');
      writer.releaseLock();
      logg(90, inputValue);
      return 0;
      } catch (err) {
            logg(9,"sendtoPort error="+err.message);
            return 2;
      }
    }


    async function sendtoPortwithTimeout (inputValue) {
    try {
        // Wait for the async operation, but with a 2-second timeout
        const result = await withTimeout(sendtoPort(inputValue), 2000);
        // console.log("sendtoPort:"+inputValue);
    } catch (error) {
        logg (9,"error="+error.message);  // Output: 'Operation timed out'
    }
    }

    function flushBuffer() {
       let i=0;
       for (i=0; i<1000; i++) {
        let l=globalBuffer.length;
        if (l<=0) break;
        s=getBufferLine();
        if (s.length>0) {
               logg(92,s);                   
        }
       }
       // showBuffer('flushBuffer loops:'+i);
    }

    function getBufferLine() {
        let i=0;
        let s="";
        i=globalBuffer.indexOf('\n');
        if (i<0) return('');
        s=globalBuffer.substring(0,i);
        s=s.trim();
        globalBuffer=globalBuffer.substring(i+1);
        return(s);
    }

    function setDigital(port, v) {
        let s='$D'+String.fromCharCode(port+48)+String.fromCharCode(v+48);
        sendReceivePort(s);
    }

    function setD00() { setDigital(0,0); }
    function setD01() { setDigital(0,1); }
    function setD10() { setDigital(1,0); }
    function setD11() { setDigital(1,1); }

    function setD20() { setDigital(2,0); }
    function setD21() { setDigital(2,1); }
    function setD30() { setDigital(3,0); }
    function setD31() { setDigital(3,1); }

    function setD40() { setDigital(4,0); }
    function setD41() { setDigital(4,1); }
    function setD50() { setDigital(5,0); }
    function setD51() { setDigital(5,1); }
    
    function setD60() { setDigital(6,0); }
    function setD61() { setDigital(6,1); }
    function setD70() { setDigital(7,0); }
    function setD71() { setDigital(7,1); }
    
    async function setDa0() { 
        for (i=0; i<8; i++) {
            setDigital(i,0);
            await delay(100);
        } 
    }
    async function setDa1() { 
        for (i=0; i<8; i++) {
            setDigital(i,1);
            await delay(100);
        } 
    }

    async function openHatch(hatchno) { 
        setDigital(7,1);
        await delay(2000);
        switch (hatchno) {
        case 1: setDigital(4,1); await delay(100); setDigital(4,0); break;
        case 2: setDigital(5,1); await delay(100); setDigital(5,0); break;
        }
    }

    async function sendReceivePort (inputValue) {
    let ret=0;
    let result;
    let i=0;
    let s;
    const MAXLOOP=200;
    if (globalState<=0) {
        logg (9, "sp no connection, can not send");
        return 1;           // we are not connected
    }

    globalState=2;          // stop automatic flushing
    flushBuffer();          // empty buffer
    try {
        result = await sendtoPort(inputValue);
        for (n=0; n<MAXLOOP; n++) {
            await new Promise(resolve => setTimeout(resolve, 10)); // yield till läsloopen, tiden inte så viktig
            i=globalBuffer.indexOf('\n');
            if (i>=0) break;
        }
        console.log('Needed loops:'+n);
        if (n<MAXLOOP) {
            s=getBufferLine();
           
            // i framtiden ska vi kontrollera korrekt svar här
            try {recCallback(s); } catch(error) {};
            logg(91, s);
        } else {
            logg(9,"sendReceivePort No Reply");
            ret=2;
        }
    } catch (error) {
        logg(9,"sendReceivePort:"+error.message)
        return ret=3;
    }
    globalState=1;
    return ret;
    }
/*
    navigator.serial.addEventListener('disconnect', (event) => {
            if (port === event.target) {
                console.log('Port disconnected:', event.target);
                port = null;
            }
        });

    navigator.serial.addEventListener('connect', (event) => {
            console.log('Port connected:', event.target);
        });
*/
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


    // Call this from the html document.
    // Html document must provide showBuffer() for reporting
    // This loop runs forever and is the only place that reads the serial port
    // It handles connection and reconnection of the serial port
    // globalBuffer is grown as serial input is received and shrinked according to algorithm
    async function readLoop() {
      let l=0;
      let cErrors=0;
      // await connectPort();
      // await delay(1000);
      globalState=0;
      while (true) {
        try {

        if (globalState>0) {
            const { value, done } = await reader.read();    // väntar normalt alltid här
            if (done) {                                     // om rejected kommer vi ut här
                reader.releaseLock();
                if (globalState>0) {
                   logg(9,'Unexpected End of Stream');
                   await disconnectPort();
                   globalState=0;
                }
            }
            else globalBuffer += value;
        }
        
        switch (globalState) {
            case -1:                 // Disconnecting
            await delay(200);       // frigör cpu från tajt loop
                // logg(1020, "disconnecting");
            break;
            case 0:                 // Not connected
                r = await reconnectPort();
                if (r==0) {
                    logg (100, "sp connected");
                    globalState=1;
                    cErrors=0;
                } else {
                    if (cErrors==0) logg (r, "sp not connected");
                    cErrors++;
                }
                await delay(1000);
                break;
            case 1:                 // Idle,nothing expected, just keep buffer empty
              flushBuffer();
              l=globalBuffer.length;
              if (l>MAXLEN_GLOBALBUFFER) {
                logg(99,'Overrun buffer, reached maxlen:'+MAXLEN_GLOBALBUFFER+' '+globalBuffer);
                globalBuffer='';
                await delay(1);       // frigör cpu från tajt loop
              }
              break;
            case 2:                   // Monitoring buffer elsewhere
              await delay(1);       // frigör cpu från tajt loop
              break;
            default:
              await delay(200);       // frigör cpu från tajt loop 
              break;
        }

        } catch (err) {
            cErrors++;
            // if (cErrors==1) {
                logg(1090,err.message);
                // console.error('Error:', err);
            // }
            await delay(1000);
            await disconnectPort();
            await delay(1000);
            globalState=0;
        }
      }
    }


// readLoop(); Call like this from the html document
