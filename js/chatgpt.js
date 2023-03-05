const defaultRequest = "一首古诗";
const systemDefination = "You are a helpful assistant.";
const session = [];

function init(){
    appendSession("system", systemDefination);
    printStatus(systemDefination);
}

// Define formatMessage function
function formatMessage(message) {
    const md = window.markdownit();
    return md.render(message);
}

// Define showTimeDiff function
function showStatus(timeDiff, tokenUsed) {
    timeDiff = (timeDiff / 1000).toFixed(2);
    printStatus(`请求用时：${timeDiff} 秒;`+`使用Token：${tokenUsed}`);
}

function appendPromptToSession(prompt) {
    appendSession("user", prompt);
}

function appendResponseToSession(message) {
    appendSession("assistant", message);
}

function appendSession(role, message) {
    session.push({ "role": role, "content": message })
}

// Define printMessage function
function printMessage(message, className) {
    var containerDiv = document.createElement('div');
    containerDiv.classList.add(className);
    containerDiv.classList.add("chatgpt-box");
    var messageDiv = document.createElement('div');
    messageDiv.className = "chatgpt-message";
    messageDiv.innerHTML = formatMessage(message);
    containerDiv.appendChild(messageDiv);
    var chatWindow = document.getElementById('chatgpt-session');
    chatWindow.appendChild(containerDiv);
}

function printStatus(message) {
    var statusLabel = document.getElementById('chatgpt-status');
    statusLabel.innerText = message;
}
// Define callCHATGPT async function
async function callChatGPT() {
    const openAIUrl = "https://api.openai.com/v1/chat/completions";
    const openAIKey = "Bearer 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";
    const openAIModel = "gpt-3.5-turbo";
    updateButtonState(0);

    const startTime = performance.now();
    var xhr = new XMLHttpRequest();
    xhr.open("POST", openAIUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // 设置Key
    xhr.setRequestHeader("Authorization", openAIKey);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const endTime = performance.now(); // 记录结束时间
            const timeDiff = endTime - startTime; // 计算时间差
            updateButtonState(1);
            var tokenUsed = 0;
            var json = JSON.parse(xhr.responseText);
            var choice = json.choices[0];
            if (xhr.status === 200) {
                var response = choice.message.content;
                tokenUsed = json.usage.total_tokens;
                appendPromptToSession(response);
                printMessage(response, "chatgpt-response");
            }
            else {
                var response = choice.message.content;
                printMessage(response, "chatgpt-error");
            }
            showStatus(timeDiff, tokenUsed);
        }
    };
    var prompt = document.getElementById("chatgpt-input").value
    if (prompt == "") {
        prompt = defaultRequest;
    }
    printMessage(prompt, "chatgpt-request");
    appendPromptToSession(prompt);

    var data = JSON.stringify({
        "messages": session,
        "temperature": 0.9,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "model": openAIModel,
        "max_tokens": 2048,
        "stream": true,
    });
    console.log(data);
    await printStatus('思考中......');
    await xhr.send(data);
}

//更新按钮状态，确保按钮不会被重复按下
function updateButtonState(state) {
    const spinner = document.querySelector("#chatgpt-button .spinner-border");
    if (state == 0) {
        spinner.classList.remove("d-none");
    }
    else {
        spinner.classList.add("d-none");
    }
}

document.getElementById("chatgpt-button").addEventListener("click", callChatGPT);
window.onload = function() {
    init();
};

