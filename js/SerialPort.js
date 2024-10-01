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

    function logg (l, v) {
        if (l < 10) p=`*`;
        else if (l==90) p=">";
        else if (l==91) p="<";
        else if (l==92) p="?";
        else if (l<100) p="!";
        else p="+";
        s=`${p}:${l} ${v}`;
        showLogg (s);   // resides in html document
        console.log(s);

    }

    function showBuffer (v) {
        // output.textContent += v+'\n';
        logg(100,v);
    }

    /* Must be similar in html document
    function showLogg (v) {
        output.textContent += v+'\n';
    }
    */
    async function connectPort () {             // must be async because uses await
        try {
            
            const ports = await navigator.serial.getPorts();
            const nports = ports.length;
            // logg(100,'Connecting, ports='+nports);
            if (nports==0) {
                // logg(9, "No serialport available");
                return 9;
            }
            if(nports==1) {
                port=ports[0];      // No need to ask, try this
            }
            if (port==null) {       // If still no port
                // logg(10, 'port null:'+nports);
                port = await navigator.serial.requestPort();  // Ask User for permission and select port
            }

            if (port==null) {
                // logg(8, "Serialport null");
                return 8;
            }

                await port.open({ baudRate: 9600 });

                const textDecoder = new TextDecoderStream();
                inputDone = port.readable.pipeTo(textDecoder.writable);
                inputStream = textDecoder.readable;

                reader = inputStream.getReader();
//                readLoop();

                const textEncoder = new TextEncoderStream();
                outputDone = textEncoder.readable.pipeTo(port.writable);
                outputStream = textEncoder.writable;

                portstatus=1;
                return 0;

            } catch (error) {
                // logg (7, err);
                return 7;
            }
    };

    async function disconnectPort () {
        logg(100,'disconnectPort');
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
            await port.close();
            port = null;
        } catch (err) {
            // reportStatus('Error:'+err);
            // console.error('Error:', err);
            logg(9,"Disconnect error="+err.message);
        }
    };

    async function sendtoPort (inputValue) {
    try {
      const writer = outputStream.getWriter();
      await writer.write(inputValue+'\r\n');
      writer.releaseLock();
      logg(90, inputValue);
      } catch (err) {
            logg(9,"sendtoPort error="+err.message);
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
        console.log(s);
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

    async function sendReceivePort (inputValue) {
    let result;
    let i=0;
    const MAXLOOP=200;
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
            logg(91, s);
        } else logg(9,"sendReceivePort No Reply");
    } catch (error) {
        logg(9,"sendReceivePort:"+error.message)
    }
    globalState=1;
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

function reportStatus(txt)
{
    showBuffer('!:'+txt)
    // result.textContent = txt;
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
            const { value, done } = await reader.read();    // waits for a chunk of input
            if (done) {
                reader.releaseLock();
                logg(9,'Unexpected End of Stream');
                globalState=0;
            }
            else globalBuffer += value;
        }
        
        switch (globalState) {
            case 0:                 // Not connected
                r = await connectPort();
                if (r==0) {
                    logg (100, "Connected");
                    globalState=1;
                    cErrors=0;
                } else {
                    if (cErrors==0) logg (r, "connectPort");
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
              }
              break;
            case 2:         // Monitoring buffer elsewhere
            
              break;
            case 3: 
              break;
        }

        } catch (err) {
            cErrors++;
            if (cErrors==1) {
                logg(9,err.message);
                // console.error('Error:', err);
            }
            await delay(1000);
            //    await new Promise(resolve => setTimeout(resolve, 1000));    // cool down loop
            disconnectPort();
            await delay(1000);
            globalState=0;
/*                const ports = await navigator.serial.getPorts();
                const nports = ports.length;
                console.log('Reconnect ports.length:'+nports);
                if(nports==1) {
                    connectPort();
                    await new Promise(resolve => setTimeout(resolve, 2000));    // cool down loop
                }
                    */
        }
      }
    }


// readLoop(); Call like this from the html document
