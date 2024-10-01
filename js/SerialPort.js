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

    async function connectPort () {
        try {

            const ports = await navigator.serial.getPorts();
            const nports = ports.length;
            console.log('connectPort: ports.length:'+nports);
            if (nports==0) {
                reportStatus("No serialport available");
                return;
            }
            if(nports==1) {
                port=ports[0];      // No need to ask, try this
            }
            if (port==null) {       // If still no port
                console.log('port null:'+nports);
                port = await navigator.serial.requestPort();  // Ask User for permission and select port
            }

            if (port==null) {
                reportStatus("No serialport available");
                return;
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

            } catch (error) {
                reportStatus('Error:'+err);
                console.error('There was an error opening the serial port:', error);
            }
    };

    async function disconnectPort () {
        console.log('disconnectPort');
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
            console.error('Error:', err);
        }
    };

    async function sendtoPort (inputValue) {
    try {
      const writer = outputStream.getWriter();
      await writer.write(inputValue+'\r\n');
      writer.releaseLock();
      } catch (err) {
            reportStatus('Error:'+err);
            console.error('Error:', err);
      }
    }

    function showBuffer (v) {
            output.textContent += v+'\n';
    }

    async function sendtoPortwithTimeout (inputValue) {
    try {
        // Wait for the async operation, but with a 2-second timeout
        const result = await withTimeout(sendtoPort(inputValue), 2000);
        console.log("sendtoPort:"+inputValue);
    } catch (error) {
        console.error(error.message);  // Output: 'Operation timed out'
    }
    }

    function flushBuffer() {
       let i=0;
       for (i=0; i<1000; i++) {
        let l=globalBuffer.length;
        if (l<=0) break;
        s=getBufferLine();
        if (s.length>0) {
               showBuffer('?:'+s);                   
        }
       }
       // showBuffer('flushBuffer loops:'+i);
    }

    function getBufferLine() {
        let i=0;
        let s="";
        // console.log('1:'+globalBuffer.length);
        i=globalBuffer.indexOf('\n');
        if (i<0) return('');
        s=globalBuffer.substr(0,i);
        // console.log('s:'+s.length);
        s=s.trim();
        // console.log('s.trim:'+s.length);
        globalBuffer=globalBuffer.substr(i+1);
        // console.log('2:'+globalBuffer.length);
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
    
    function setDa0() { 
        for (i=0; i<8; i++) {
            setDigital(i,0);
        } 
    }
    function setDa1() { 
        for (i=0; i<8; i++) {
            setDigital(i,1);
        } 
    }

    async function sendReceivePort (inputValue) {
    let result;
    let i=0;

    globalState=1;          // stop automatic flushing
    flushBuffer();          // empty buffer
    try {
        result = await sendtoPort(inputValue);
        showBuffer('>:'+inputValue);
        //  result = await withTimeout(sendtoPort(inputValue), 2000); // Wait for the async operation, but with a 2-second timeout
        console.log("sendtoPort:"+inputValue); 

        for (n=0; n<200; n++) {
            await new Promise(resolve => setTimeout(resolve, 10)); // yield till läsloopen


            i=globalBuffer.indexOf('\n');
            // console.log('newline:'+i);
            if (i>=0) break;
            i=globalBuffer.indexOf('\r');
            // console.log('return:'+i);
        }
        // output.textContent = globalBuffer;
        console.log('Needed loops:'+n);
        s=getBufferLine();
        showBuffer('<:'+s);
    } catch (error) {
        console.error(error.message);  // Output: 'Operation timed out'
    }
    globalState=0;
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

    // This loop runs forever and is the only place that reads the serial port
    async function readLoop() {
      let l=0;
      connectPort();
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      while (true) {
        try {

        const { value, done } = await reader.read();    // waits for a chunk of input
        if (done) {
          reader.releaseLock();
          reportStatus('End of Stream');
          break;
        }
        globalBuffer += value;
        switch (globalState) {
            case 0:                 // Idle,nothing expected
              flushBuffer();
              l=globalBuffer.length;
              if (l>MAXLEN_GLOBALBUFFER) {
                showBuffer('Flushed buffer reached:'+MAXLEN_GLOBALBUFFER+' '+globalBuffer);
                globalBuffer='';
              }
              break;
            case 1:         // Monitoring buffer elsewhere
            
              break;
            case 2: 
            break;
        }

        } catch (err) {
                // reportStatus('Error:'+err);
                console.error('Error:', err);
                await new Promise(resolve => setTimeout(resolve, 1000));    // cool down loop
                disconnectPort();
                const ports = await navigator.serial.getPorts();
                const nports = ports.length;
                console.log('Reconnect ports.length:'+nports);
                if(nports==1) {
                    connectPort();
                    await new Promise(resolve => setTimeout(resolve, 2000));    // cool down loop
                }
           }
        }
    }


// readLoop();
