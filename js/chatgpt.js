const __defaultRequest = "请随意给我一些有意思的内容。不要让我选择，请直接提供结果。";
const __systemDefination = "You are a helpful assistant.";
var _openAIKey = "Bearer sk-xxx";

var _sessions = {};
var _currentSession = [];
var _currentSessionWithFullInfo = [];
var _currentSessionId = "";

function init() {
    _openAIKey = _openAIKey.replace("sk-xxx", realOpenAIKey);
    var result = getLocalStorage("sessions");
    if (result != null) {
        _sessions = result;
        initSessions();
        //初始化当前会话
        _currentSessionId = _sessions.lastSessionId;
        if (_currentSessionId != null) {
            var currentSessionItem = _sessions[_currentSessionId];
            if (currentSessionItem != null) {
                _currentSession = currentSessionItem.session;
            }
        }
        initSession();
    }

    document.getElementById("chatgpt-sumit").addEventListener("click", callChatGPT);
    document.getElementById("chatgpt-input").addEventListener("keyup", inputEnter);
    document.getElementById("chatgpt-clear").addEventListener("click", clearSession);
    document.getElementById("chatgpt-clearAll").addEventListener("click", clearSessions);
    document.getElementById("chatgpt-newSession").addEventListener("click", createSession);

    function inputEnter(event) {
        if (event.key == 'Enter' && !event.shiftKey) {
            event.preventDefault();
            callChatGPT(); // 调用callChatGPT函数
        }
    }
}

function createSession() {
    _currentSessionId = "";
    _currentSession = [];
    _currentSessionWithFullInfo = [];
    initSession();
}

//从currentSession便利所有属性，如果属性名为“lastSessionId”则跳过，否则调用appendSessionItem方法。
function initSessions() {
    document.querySelector(".session-list").innerHTML = "";
    for (let property in _sessions) {
        if (property === "lastSessionId") {
            continue;
        } else {
            appendSessionItem(property);
            updateSessionItem(property, _sessions[property]);
        }
    }
    _currentSessionId = "";
    _currentSession.length = 0;
    _currentSessionWithFullInfo.length = 0;
}

function appendSessionItem(sessionId) {
    var li = document.createElement("li");
    li.classList.add("session-item");
    li.id = sessionId;

    var avatar = document.createElement("div");
    avatar.classList.add("avatar");
    li.appendChild(avatar);

    var content = document.createElement("div");
    content.classList.add("content", "itemContainer");
    li.appendChild(content);

    var title = document.createElement("div");
    title.classList.add("title");
    title.value = sessionId;
    title.addEventListener("click", function () {
        changeSession(title.value);
    });
    content.appendChild(title);


    var preview = document.createElement("div");
    preview.classList.add("preview");
    content.appendChild(preview);

    var time = document.createElement("div");
    time.classList.add("time");
    content.appendChild(time);

    var deleteButton = document.createElement("button");
    deleteButton.classList.add('chatgpt-button');
    deleteButton.setAttribute('autocomplete', 'off');
    deleteButton.value = sessionId;
    var deleteButtonInner = document.createElement("a");
    deleteButtonInner.classList.add('icon', 'deleteicon');
    deleteButton.appendChild(deleteButtonInner);
    li.appendChild(deleteButton);
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    deleteButton.addEventListener("click", function () {
        deleteSession(deleteButton.value);
    });

    var sessionList = document.querySelector(".session-list");
    if (sessionList.childNodes.length > 0) {
        sessionList.insertBefore(li, sessionList.childNodes[0]);
    }
    else {
        sessionList.appendChild(li);
    }
}

function changeSession(sessionId) {
    _currentSessionId = sessionId;
    _currentSession = _sessions[sessionId].session;
    _currentSessionWithFullInfo = _sessions[sessionId].sessionWithFullInfo;
    _sessions.lastSessionId = _currentSessionId;
    storeToLocal("sessions", _sessions);
    initSession();
}

function initSession() {
    var chatWindow = document.getElementById('chatgpt-session');
    chatWindow.innerHTML = "";
    if (_currentSession.length == 0) {
        appendSession("system", __systemDefination);
    }
    else {
        //从session数组中遍历，并将每个成员的role和content调用printMessage输出
        for (let i = 0; i < _currentSession.length; i++) {
            const { role, content } = _currentSession[i];
            if (role === "system") {
                printStatus(content);
                continue;
            }
            printMessage(content, "chatgpt-" + role);
        }
    }
    setSessionItemActive(_currentSessionId);
}

function setSessionItemActive(sessionId) {
    var items = document.getElementsByClassName("active");
    if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.classList.remove("active");
        }
    }
    let element = document.getElementById(sessionId);
    element.classList.add("active");
}


// Define formatMessage function
function formatMessage(message) {
    const md = window.markdownit();
    return md.render(message);
}

// Define showTimeDiff function
function showStatus(timeDiff, tokenUsed) {
    timeDiff = (timeDiff / 1000).toFixed(2);
    cost = (tokenUsed / 10 * 0.002).toFixed(4);
    printStatus(`请求用时：${timeDiff} 秒；` + `使用 Token：${tokenUsed}；` + `花费：${cost}美分`);
}

function appendPromptToSession(prompt) {
    appendSession("user", prompt, generateGUID(), 0);
}

function appendResponseToSession(message, chatId, timeDiff) {
    appendSession("assistant", message);
}

function appendSession(role, message, chatId, timeDiff) {
    _currentSession.push({ "role": role, "content": message });
    _currentSessionWithFullInfo.push({ "role": role, "content": message, "chatId": chatId, "timeDiff": timeDiff });
    var currentSessionItem = null;
    if (_currentSessionId == "" || _sessions[_currentSessionId] == null) {
        _currentSessionId = generateGUID();
        currentSessionItem = { "session": _currentSession, "sessionWithFullInfo": _currentSessionWithFullInfo, "titleSetted": false, "title": "New Chat", "message": "等待输入..." };
        appendSessionItem(_currentSessionId);
    }
    else {
        currentSessionItem = _sessions[_currentSessionId];
    }
    if (role != "system") {
        if (!currentSessionItem.titleSetted) {
            currentSessionItem.title = message;
            currentSessionItem.titleSetted = true;
        }
    }
    currentSessionItem.preview = message ? message : "等待输入...";
    currentSessionItem.time = getNowDateTimeString();
    updateSessionItem(_currentSessionId, currentSessionItem);
    _sessions.lastSessionId = _currentSessionId;
    _sessions[_currentSessionId] = currentSessionItem;
    storeToLocal("sessions", _sessions);
}

//生成GUID
function generateGUID() {
    let guid = '';
    for (let i = 0; i < 8; i++) {
        guid += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return guid;
}

//将value存储到本地的key中，使用LocalStorage
function storeToLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

//将LocalStorage中的key对应的值提取出来，如果没有这个key，则返回空数组。
function getLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
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
    //自动滚动到chatWindow的最下方
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function printStatus(message) {
    var statusLabel = document.getElementById('chatgpt-status');
    statusLabel.innerText = message;
}
// Define callCHATGPT async function
async function callChatGPT() {
    const openAIUrl = "https://api.openai.com/v1/chat/completions";
    const openAIModel = "gpt-3.5-turbo";
    updateButtonState(0);

    const startTime = performance.now();
    var xhr = new XMLHttpRequest();
    xhr.open("POST", openAIUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // 设置Key
    xhr.setRequestHeader("Authorization", _openAIKey);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const endTime = performance.now(); // 记录结束时间
            const timeDiff = endTime - startTime; // 计算时间差
            updateButtonState(1);
            var tokenUsed = 0;
            var json = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
                var chatId = json.id;
                var choice = json.choices[0];
                var response = choice.message.content;
                tokenUsed = json.usage.total_tokens;
                appendResponseToSession(response, chatId, timeDiff);
                printMessage(response, "chatgpt-assistant");
            }
            else {
                var response = json.error.message;
                printMessage(response, "chatgpt-error");
            }
            showStatus(timeDiff, tokenUsed);
        }
    };
    var input = document.getElementById("chatgpt-input")
    var prompt = input.value;
    if (prompt == "") {
        prompt = __defaultRequest;
    }
    input.value = "";

    printMessage(prompt, "chatgpt-user");
    appendPromptToSession(prompt);

    var data = JSON.stringify({
        "messages": _currentSession,
        "temperature": 0.9,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "model": openAIModel,
        "max_tokens": 2048,
        // "stream": true, 暂时不用Stream，后续调整为后端Server后，再用Stream
    });
    console.log(data);
    await printStatus('思考中......');
    await xhr.send(data);
}

//更新按钮状态，确保按钮不会被重复按下
function updateButtonState(state) {
    const spinner = document.querySelector("#chatgpt-sumit .spinner-border");
    if (state == 0) {
        spinner.classList.remove("d-none");
    }
    else {
        spinner.classList.add("d-none");
    }
}

function clearSessions() {
    //弹出提示确认清除，如果不确认则跳过
    if (confirm("是否确定要清除所有会话？")) {
        //清空sessions的所有属性
        for (let prop in _sessions) {
            if (prop !== "lastSessionId") {
                delete _sessions[prop];
            }
        }
        _sessions.lastSessionId = null;
        storeToLocal("sessions", _sessions);
        initSessions();
        initSession();
    } else {
        //跳过操作
    }
}

function clearSession() {
    //弹出提示确认清除，如果不确认则跳过
    if (confirm("是否确定要清除当前历史对话？")) {
        //执行清除session的操作
        _currentSession.length = 0;
        _currentSessionWithFullInfo.length = 0;
        initSession();
    } else {
        //跳过操作
    }
}


function deleteSession(sessionId) {
    //弹出提示确认清除，如果不确认则跳过
    if (confirm("是否确定要删除该会话？")) {
        //执行删除session的操作
        delete _sessions[sessionId];
        storeToLocal("sessions", _sessions);
        deleteSessionItem(sessionId);
        //如果当前Session为要删除的Session，则创建新Session
        if (_currentSessionId == sessionId) {
            _currentSessionId = "";
            _currentSession.length = 0;
            _currentSessionWithFullInfo.length = 0;
            initSession();
        }
    } else {
        //跳过操作
    }
}

function deleteSessionItem(sessionId) {
    let element = document.getElementById(sessionId);
    element.parentNode.removeChild(element);
}

function getNowDateTimeString() {
    const currentDate = new Date();

    // 获取所有需要的值（年份、月份、日期、小时数、分钟数、秒数）
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');

    // 数组连接成字符串，并以指定格式呈现
    const formattedString = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

    return formattedString;
}

function updateSessionItem(id, sessionItem) {
    setSessionItem(id, sessionItem.title, sessionItem.preview, sessionItem.time);
    function setSessionItem(id, title, preview, time) {
        //对Id为id的li元素下的内容赋值，将该li下class为"title"的div元素内容设为title，将该li下class为"preview"的div元素内容设为preview，且内容长度过长时自动截断。
        const li = document.getElementById(id);

        if (li) {
            const titleEl = li.querySelector('.title');
            const previewEl = li.querySelector('.preview');
            const timeEl = li.querySelector('.time');
            const maxLength = 10;
            if (titleEl && title) {
                if (title.length > maxLength) {
                    title = title.substr(0, maxLength) + '...';
                }
                titleEl.innerHTML = title;
            }

            if (previewEl && preview) {
                if (preview.length > maxLength) {
                    preview = preview.substr(0, maxLength) + '...';
                }
                previewEl.innerHTML = preview;
            }

            if (timeEl) {
                timeEl.innerHTML = time;
            }
        }
    }
}

window.onload = function () {
    init();
};