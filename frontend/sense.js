export class SenseService {
    speaker;
    listener;
    state;
    onStateChanges = () => {};
  
    async init() {
      try {
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
  
        const voice = await this.getVoice();
  
        this.speaker = this.createSpeaker(voice);
        await this.speak('ready');
  
        this.listener = await this.createListener();
        // this.startListening();
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  
    updateState(state = null) {
      this.state = state;
      this.onStateChanges && this.onStateChanges(state);
    }
  
    createSpeaker(voice) {
      const speaker = new SpeechSynthesisUtterance();
      speaker.voice = voice;
      speaker.lang = voice.lang;
      return speaker;
    }
  
    speak(text) {
      if (this.state === 'listening' || this.state === 'speaking') return;
      this.updateState('speaking');
  
      return new Promise((resolve) => {
        this.speaker.text = text;
        this.speaker.onend = () => {
          //   console.log('speak ended????');
          this.updateState(null);
          this.speaker.onend = null;
          return resolve();
        };
        window.speechSynthesis.speak(this.speaker);
      });
    }
  
    queue = [];
    finished;
    async speakQueue(text) {
      if (text?.length) {
        this.queue.push(text);
      }
  
      if (this.finished) return this.finished;
  
      this.finished = new Promise(async (resolve) => {
        while (this.queue.length) {
          const first = this.queue.shift();
          await this.speak(first);
        }
        this.finished = null;
        return resolve();
      });
  
      return this.finished;
    }
  
    stopSpeaking() {
      window.speechSynthesis.cancel();
      this.speaker.onend && this.speaker.onend();
    }
  
    stopListening() {
      this.listener.stop();
      this.listener?.onresult && this.listener?.onresult();
    }
  
    stopAll() {
      this.stopSpeaking();
      this.stopListening();
    }
  
    async listen(stop = false) {
      // console.log(stop);
      if (!stop) {
        if (this.state === 'listening' || this.state === 'speaking') return;
      }
  
      if (stop && this.state === 'speaking') {
        this.stopSpeaking();
      }
  
      this.updateState('listening');
      this.listener = await this.createListener();
  
      return new Promise((resolve) => {
        this.listener.onresult = (speech) => {
          this.updateState();
  
          const term = this.extractText(speech);
          // console.log(term);
          this.listener.onresult = null;
          this.listener.stop();
  
          return resolve(term);
        };
        this.listener.start();
      });
    }
  
    extractText(speech) {
      if (!speech) return;
  
      let term = '';
      let result = speech.results[speech.resultIndex];
      let transcript = result[0].transcript;
      let confidence = result[0].confidence;
      if (result.isFinal) {
        if (result[0].confidence < 0.3) {
          // console.log('Not recognized');
        } else {
          term = transcript.trim();
          // console.log(term);
        }
      } else {
        if (result[0].confidence > 0.6) {
          term = transcript.trim();
        }
      }
      return term;
      return {
        term,
        confidence,
        isFinal: result.isFinal,
      };
    }
  
    async getVoice(id = 'Google US English') {
      const voices = await this.getVoices();
      // console.log(voices);
      const voice = (voices).find((i) => i.name == id);
      // console.log(voice);
      return voice;
    }
  
    async getVoices() {
      return new Promise((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices();
  
          // we are removing the function after its called,
          // as we will not need this to be called any more.
          window.speechSynthesis.onvoiceschanged = null;
  
          return resolve(voices);
        };
      });
    }
  
    async createListener() {
      const webkitSpeechRecognition = (window).webkitSpeechRecognition;
      const listener = new webkitSpeechRecognition();
      listener.continuous = true;
      listener.interimResults = false;
      listener.maxAlternatives = 1;
      listener.maxResults = 25;
  
      listener.onstart = () => {
        this.updateState('listening');
      };
  
      // listener.onresult = (speech) => {
      //     this.state = null;
  
      //     const term = this.extractText(speech);
      //     console.log(term);
      //     if (speech.results) {
      //         // let term: RecognizedText;
      //         // term = extractText(speech);
      //         // // console.log(term)
  
      //         // if (term.isFinal) {
      //         //     console.log(term);
      //         //     console.log(term.term);
      //         // }
      //     }
      // };
  
      listener.onerror = (error) => {
        this.updateState();
        if (error.error === 'no-speech') {
        } else if (error.error === 'not-allowed') {
          // isAllowed = false;
          console.error(error.error);
        } else {
          console.error(error.error);
        }
      };
  
      listener.onend = () => {
        // this.listener.onresult && this.listener.onresult();
        this.stopListening();
        this.updateState();
      };
  
      return listener;
    }
  }
  
  // const input_txt = document.getElementById("chatui-input");
  // const btn = document.getElementById("chatui-send-btn");
  // const output_txt = document.getElementById("ai_output");
  
  // const delay = (time = 1000) => new Promise(resolve=> setTimeout(resolve, time));
  // function getAiOutput() {
  //     return new Promise(async resolve=>{
  //         while(true) {
  //             const content = output_txt.textContent;
  
  //             if(content.length>0) return resolve(content);
  //             await delay(1000);
  //         }
  
  //     })
  // }
  
  // obj.onStateChanges = (s)=> updateState(s);
  
  // let continueRunning = true;
  // export function stop() {
  //     obj.stopSpeaking();
  //     continueRunning = false;
  // }
  
  // function updateState(state) {
  //     state = state ? state : '';
  //     document.getElementById('state').innerText = state;
  // }
  