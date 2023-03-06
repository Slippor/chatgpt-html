const __defaultRequest = "请随意给我一些有意思的内容。不要让我选择，请直接提供结果。";
const __systemDefination = "You are a helpful assistant.";
const __openAIUrl = "https://api.openai.com/v1/chat/completions";
const __openAIModel = "gpt-3.5-turbo";
var _openAIKey = "Bearer sk-******";

var _sessions = {};
var _currentSessionId = "";
var _currentSession = createSession();

function createSession(){
    return {"system": __systemDefination, "conversations":[]};
}

function init() {
    _openAIKey = _openAIKey.replace("sk-******", realOpenAIKey);
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
            initSession();
        }
    }

    document.getElementById("chatgpt-sumit").addEventListener("click", callChatGPT);
    document.getElementById("chatgpt-input").addEventListener("keyup", inputEnter);
    document.getElementById("chatgpt-clear").addEventListener("click", clearSession);
    document.getElementById("chatgpt-clearAll").addEventListener("click", clearSessions);
    document.getElementById("chatgpt-newSession").addEventListener("click", renewSession);
    document.getElementById("chatgpt-systemedit").addEventListener("click", onEditModeBtnClick);

    function inputEnter(event) {
        if (event.key == 'Enter' && !event.shiftKey) {
            event.preventDefault();
            callChatGPT(); // 调用callChatGPT函数
        }
    }
}

function renewSession() {
    _currentSessionId = "";
    _currentSession = createSession();
    initSession();
}

//从currentSession遍历所有属性，如果属性名为“lastSessionId”则跳过，否则调用appendSessionItem方法。
function initSessions() {
    document.querySelector(".session-list").innerHTML = "";
    for (let property in _sessions) {
        if (property === "lastSessionId") {
            continue;
        } else {
            appendSessionListItem(property);
            updateSessionListItem(property, _sessions[property]);
        }
    }
    _currentSessionId = "";
    _currentSession = createSession();
}

// 添加会话列表
function appendSessionListItem(sessionId) {
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
    _sessions.lastSessionId = _currentSessionId;
    updateStoredSessions();
    initSession();
}

function updateStoredSessions(){
    storeToLocal("sessions", _sessions);
}

function initSession() {
    printSystem(_currentSession.system);

    var chatWindow = document.getElementById('chatgpt-session');
    chatWindow.innerHTML = "";
    if (_currentSession.conversations == null || _currentSession.conversations.length == 0) {
    }
    else {
        //从session数组中遍历，并将每个成员的role和content调用printMessage输出
        for (let i = 0; i < _currentSession.conversations.length; i++) {
            const conversion = _currentSession.conversations[i];
            printMessage(conversion.content, "chatgpt-" + conversion.role, conversion.chatId, conversion.filtered);
        }
    }
    setSessionItemActive(_currentSessionId);
}

function printSystem(message){
    var systemErea = document.getElementById('chatgpt-systeminput');
    systemErea.value = message;
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
    if(element != null){
        element.classList.add("active");
    }
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

function appendPromptToSession(prompt, chatId, sessionId) {
    return appendSession("user", prompt, chatId, 0, sessionId);
}

function appendResponseToSession(message, chatId, timeDiff, sessionId) {
    return appendSession("assistant", message, chatId, timeDiff, sessionId);
}

function updateSystemToSession(message) {
    _currentSession.system = message;
    updateStoredSessions();
}

function appendSession(role, message, chatId, timeDiff, sessionId) {
    var session = null;
    if (sessionId == _currentSessionId) {
        session = _currentSession;
    } else {
        session = _sessions[sessionId].session;
    }
    session.conversations.push({ "role": role, "content": message, "chatId": chatId, "timeDiff": timeDiff, "filtered": false });

    var sessionItem = null;
    if (sessionId == "" || _sessions[sessionId] == null) {
        var newID = generateGUID();
        if (_currentSessionId == sessionId) {
            _currentSessionId = newID;
        }
        sessionId = newID;
        sessionItem = { "session": session, "titleSetted": false, "title": "New Chat", "message": "等待输入..." };
        appendSessionListItem(_currentSessionId);
    }
    else {
        sessionItem = _sessions[sessionId];
    }
    if (role != "system") {
        if (!sessionItem.titleSetted) {
            sessionItem.title = message;
            sessionItem.titleSetted = true;
        }
    }
    sessionItem.preview = message ? message : "等待输入...";
    sessionItem.time = getNowDateTimeString();
    updateSessionListItem(sessionId, sessionItem);
    if (sessionId == _currentSessionId) {
        _sessions.lastSessionId = _currentSessionId;
    }
    _sessions[sessionId] = sessionItem;
    updateStoredSessions();
    //sessionId可能会更新
    return sessionId;
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
function printMessage(message, className, messageId, filtered) {
    var containerDiv = document.createElement('div');
    containerDiv.classList.add(className);
    containerDiv.classList.add("chatgpt-box");

    //只有鼠标挪到containerDiv上，toolbar才会显示
    var toolbar = document.createElement('ul');
    toolbar.classList.add("chatgpt-toolbar");

    var li =  document.createElement('li');
    //在containerDiv中添加一个Checkbox，class为message-check
    let newCheckbox = document.createElement("input");
    newCheckbox.type = "checkbox";
    newCheckbox.checked = !filtered;
    newCheckbox.value = messageId;
    newCheckbox.className = "message-check";
    //当newCheckbox的选中状态改变时，执行方法messageFilter，传入newCheckBox的value和选中状态；
    newCheckbox.addEventListener('change', function() {
        filterMessage(this.value, this.checked);
      });
    li.appendChild(newCheckbox);
    toolbar.appendChild(li);

    var li =  document.createElement('li');
    var deleteButton = document.createElement("button");
    deleteButton.classList.add('chatgpt-button', 'deleteicon');
    deleteButton.setAttribute('autocomplete', 'off');
    deleteButton.value = messageId;
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    deleteButton.addEventListener("click", function () {
        deleteMessage(this.value);
    });
    li.appendChild(deleteButton);
    toolbar.appendChild(li);

    var li =  document.createElement('li');
    var sendButton = document.createElement("button");
    sendButton.classList.add('chatgpt-button', 'sendicon');
    sendButton.setAttribute('autocomplete', 'off');
    sendButton.value = messageId;
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    sendButton.addEventListener("click", function () {
        sendMessage(this.value);
    });
    li.appendChild(sendButton);
    toolbar.appendChild(li);
    containerDiv.appendChild(toolbar);

    var messageDiv = document.createElement('div');
    messageDiv.className = "chatgpt-message";
    messageDiv.innerHTML = formatMessage(message);
    containerDiv.appendChild(messageDiv);
    
    var chatWindow = document.getElementById('chatgpt-session');
    chatWindow.appendChild(containerDiv);
    //自动滚动到chatWindow的最下方
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // // Hide the toolbar initially
    // toolbar.style.display = "none";
    // containerDiv.addEventListener("mouseover", function() {
    //     toolbar.style.display = "block";
    //   });
      
    //   containerDiv.addEventListener("mouseout", function() {
    //     toolbar.style.display = "none";
    //   });
}

//对信息做过滤
function filterMessage(messageId, checked) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversion = _currentSession.conversations[i];
        if(conversion.chatId == messageId){
            //从_currentSession.conversations中移除conversion
            conversion.filtered = !checked;
            break;
        }
    }
}

//对信息做过滤
function deleteMessage(messageId) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversion = _currentSession.conversations[i];
        if (conversion.chatId == messageId) {
            //从_currentSession.conversations中移除conversion
            _currentSession.conversations.splice(i, 1);
            break;
        }
    }
    updateStoredSessions();
    initSession();
}

//对信息做过滤
function sendMessage(messageId) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversion = _currentSession.conversations[i];
        if (conversion.chatId == messageId) {
            var input = document.getElementById("chatgpt-input");
            input.value = conversion.content;
            break;
        }
    }
    updateStoredSessions();
    initSession();
}

function printStatus(message) {
    var statusLabel = document.getElementById('chatgpt-status');
    statusLabel.innerText = message;
}

// Define callCHATGPT async function
async function callChatGPT() {

    updateButtonState(0);
    //记录当前SessionId，避免切换Session后记录串了。
    var sessionId = _currentSessionId;

    const startTime = performance.now();
    var xhr = new XMLHttpRequest();
    xhr.open("POST", __openAIUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // 设置Key
    xhr.setRequestHeader("Authorization", _openAIKey);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const endTime = performance.now(); // 记录结束时间
            const timeDiff = endTime - startTime; // 计算时间差
            updateButtonState(1);
            var tokenUsed = 0;
            if (xhr.status === 200) {
                var json = JSON.parse(xhr.responseText);
                var chatId = json.id;
                //遍历json.choices
                for (let i = 0; i < json.choices.length; i++) {
                    var choice = json.choices[i];
                    var response = choice.message.content;
                    sessionId  = appendResponseToSession(response, chatId, timeDiff, sessionId);
                    if(sessionId== _currentSessionId){
                        printMessage(response, "chatgpt-assistant", chatId, false);
                    }
                }
                tokenUsed = json.usage.total_tokens;
            }
            else if (xhr.responseText != '') {
                var json = JSON.parse(xhr.responseText);
                var response = json.error.message;
                if (sessionId == _currentSessionId) {
                    printMessage(response, "chatgpt-error", "", true);
                }
            }
            showStatus(timeDiff, tokenUsed);
        }
    };
    //将问题上屏。
    var input = document.getElementById("chatgpt-input")
    var prompt = input.value;
    if (prompt == "") {
        prompt = __defaultRequest;
    }
    input.value = "";
    var promptId = generateGUID();
    printMessage(prompt, "chatgpt-user", promptId, false);
    sessionId = appendPromptToSession(prompt, promptId, sessionId);

    var currentConversation = generateConversations();

    var data = JSON.stringify({
        "messages": currentConversation,
        "temperature": 1.2,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "model": __openAIModel,
        "max_tokens": 3072,
        // "stream": true, 暂时不用Stream，后续调整为后端Server后，再用Stream
    });
    console.log(data);
    await printStatus('思考中......');
    await xhr.send(data);
}

function generateConversations() {
    var conversations = [];
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        var conversation = _currentSession.conversations[i];
        if(!conversation.filtered){
            conversations.push({ "role": conversation.role, "content": conversation.content });
        }
    }
    //将System添加到最后，有助于始终绑定人设。
    if (_currentSession.system != null) {
        conversations.push({ "role": "system", "content": _currentSession.system });
    }
    return conversations;
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
        updateStoredSessions();
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
        _currentSession.conversations.length = 0;
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
        deleteSessionItem(sessionId);
        updateStoredSessions();
        //如果当前Session为要删除的Session，则创建新Session
        if (_currentSessionId == sessionId) {
            _currentSessionId = "";
            _currentSession.conversations.length = 0;
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

//更新Session列表信息
function updateSessionListItem(sessionId, sessionListItem) {
    setSessionItem(sessionId, sessionListItem.title, sessionListItem.preview, sessionListItem.time);
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

// 定义按钮点击事件处理函数
function onEditModeBtnClick() {
    const inputTextarea = document.getElementById('chatgpt-systeminput');
    const editModeBtn = document.getElementById('chatgpt-systemedit');
    if (inputTextarea.readOnly) {
        inputTextarea.removeAttribute('readonly');
        inputTextarea.focus();
        editModeBtn.classList.remove('editicon');
        editModeBtn.classList.add('saveicon');
        editModeBtn.title = '保存修改';
    } else {
        //保存System配置
        updateSystemToSession(inputTextarea.value);

        inputTextarea.setAttribute('readonly', '');
        editModeBtn.classList.add('editicon');
        editModeBtn.classList.remove('saveicon');
        editModeBtn.title = '编辑设定';
    }
}