// Import stylesheets
// import './perf_hooks.js';

import { SenseService } from './sense.js';

export const sense = new SenseService();

fetch(`http://127.0.0.1:5000/reset`);

let continueRunning = true;
let responses = 0;

const delay = (time = 1000) =>
  new Promise((resolve) => setTimeout(resolve, time));

sense.init();
sense.onStateChanges = (s) => updateState(s);

document.getElementById('listen-btn').addEventListener('click', startAll);
document.getElementById('stop-btn').addEventListener('click', stopAll);
document
  .getElementById('chatui-send-btn')
  .addEventListener('click', async () => {
    const prompt = input_txt.value;

    input_txt.value = '';
    send_btn.disabled = true;
    input_txt.disabled = true;

    responses += 1;
    const id = `response-${responses}`;
    addPromptUi(prompt);
    addResponseUi(id);

    await sendPrompt(prompt, (message) => {
      setLabel(id, message);
    });

    send_btn.disabled = false;
    input_txt.disabled = false;
  });

const input_txt = get('chatui-input');
const send_btn = get('chatui-send-btn');
const chatui = get('chatui-chat');

function addPromptUi(prompt) {
  const str = `
    <div class="msg right-msg">
        <div class="msg-bubble">${prompt}</div>
    </div>
    `;
  const el = document.createElement('div');
  el.innerHTML = str;
  chatui.append(el);

  chatui.scrollTop = chatui.scrollHeight;
}

function addResponseUi(id) {
  const str2 = ` <div class="msg left-msg">
                    <div id="${id}" class="msg-bubble">...</div>
                </div>`;
  const el2 = document.createElement('div');
  el2.innerHTML = str2;
  chatui.append(el2);

  chatui.scrollTop = chatui.scrollHeight;
}

function get(id) {
  return document.getElementById(id);
}

function updateState(state) {
  state = state ? state : '';
  document.getElementById('state').innerText = state;
}

function setLabel(id, text) {
  const label = document.getElementById(id);
  if (label == null) {
    throw Error('Cannot find label ' + id);
  }
  label.innerText = text;

  chatui.scrollTop = chatui.scrollHeight;
}

// todo
async function generate(prompt, callback) {
    console.log(prompt);

    const response = await fetch(`http://127.0.0.1:5000/query?query=${prompt}`);

    const reader = response.body.getReader();
    let result = '';

    while(true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log("closed!");
          break;
        } else {
          const  string = new TextDecoder().decode(value);

          result = result + string;
          callback(null, result);
        }
    }
}

async function sendPrompt(prompt, sentenceFunc) {
  if (!prompt?.length) return;

  await generate(prompt, (_, message) => {
    // setLabel(id, message);
    // sentenceFunc && sentenceFunc(message);
    sentenceFunc && sentenceFunc(message);
  });
}

// chat.setInitProgressCallback((report) => {
//   setLabel('init-label', report.text);
// });

// const generateProgressCallback = (_step, message) => {
//   setLabel("generate-label", message);
// };

// const prompt0 = "What is the capital of Canada?";
// setLabel("prompt-label", prompt0);
// const reply0 = await chat.generate(prompt0, generateProgressCallback);
// console.log(reply0);

// const prompt1 = "Can you write a poem about it?";
// setLabel("prompt-label", prompt1);
// const reply1 = await chat.generate(prompt1, generateProgressCallback);
// console.log(reply1);

// console.log(await chat.runtimeStatsText());

async function questionAndResponse(prompt, showPrompt = true) {
  showPrompt && addPromptUi(prompt);

  responses += 1;
  const id = `response-${responses}`;
  addResponseUi(id);

  let previous;
  let isQuestion;
  await sendPrompt(prompt, (answer) => {
    console.log(answer);
    // sense.speakQueue(answer);
    if (answer.match(/[!\.?]$/g)) {
      const tokens = answer.split(/[!\.?]/g);
      const last = tokens[tokens.length - 2];
      if (last === previous) return;
      console.log(last);
      sense.speakQueue(last);
      previous = last;
    }
    // sense.speakQueue(sentence);
    // isQuestion = answer.includes('?');

    setLabel(id, answer);
  });

  await sense.speakQueue();
  console.log('speaking finished');

  // console.log(answer?.endsWith('?'), previous);
//   return isQuestion;
  return true;
}

async function startListening() {
  console.log('listening called');
  const result = await sense.listen();
  if (!result) return;

  console.log('me>', result);
  const isQuestion = await questionAndResponse(result);

  return isQuestion;
}

async function startAll() {
  await questionAndResponse(
    `hi`,
    false
  );

  continueRunning = true;
  while (continueRunning) {
    const isQuestion = await startListening();

    await delay(1000);

    if (isQuestion === false) {
      await questionAndResponse(`ask me another question`, false);
    }
  }
  console.log('endeddddd');
}

function stopAll() {
  sense.stopAll();
  continueRunning = false;
}
