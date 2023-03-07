var _openAIKey = "Bearer sk-******";

var _sessions = {};
var _tempSessions = {};
var _currentSessionId = "";
var _currentSession = createSession();

function createSession() {
    return { "system": __systemDefination, "conversations": [], "tokenUsed": 0 };
}

function createSessionItem(session, sessionId) {
    if (session == null) {
        session = createSession();
    }
    return { "sessionId":sessionId, "session": session, "titleSetted": false, "title": "New Chat", "message": "等待输入..." };
}

//从currentSession遍历所有属性，如果属性名为“lastSessionId”则跳过，否则调用appendSessionItem方法。
function initSessions() {
    document.querySelector(".session-list").innerHTML = "";
    for (let property in _sessions) {
        if (property === "lastSessionId") {
            continue;
        } else {
            appendSessionListItem(property);
            updateSessionListItem(property);
        }
    }
}

// 添加会话列表
function appendSessionListItem(sessionId) {
    var sessionItemContainer = document.createElement("li");
    sessionItemContainer.classList.add("session-item");
    sessionItemContainer.id = sessionId;

    var avatar = document.createElement("div");
    avatar.classList.add("avatar");
    sessionItemContainer.appendChild(avatar);

    var content = document.createElement("div");
    content.classList.add("content", "itemContainer");
    sessionItemContainer.appendChild(content);

    var title = document.createElement("div");
    title.id = "title_" + sessionId;
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

    const toolbar = buildupSessionItemToolbar(sessionId);
    sessionItemContainer.appendChild(toolbar);
    //只有鼠标挪到sessionItemContainer上，toolbar才会显示
    toolbar.style.display = "none";
    sessionItemContainer.addEventListener("mouseover", function () {
        toolbar.style.display = "block";
    });
    sessionItemContainer.addEventListener("mouseout", function () {
        toolbar.style.display = "none";
    });

    //倒序插入，新的在最上面
    var sessionList = document.querySelector(".session-list");
    if (sessionList.childNodes.length > 0) {
        sessionList.insertBefore(sessionItemContainer, sessionList.childNodes[0]);
    }
    else {
        sessionList.appendChild(sessionItemContainer);
    }

}

function buildupSessionItemToolbar(sessionId){
    const toolbar = document.createElement('ul');
    toolbar.classList.add("chatgpt-toolbar");

    let li = document.createElement('li');
    var editButton = newButton(sessionId, "editicon", "编辑");
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    editButton.addEventListener("click", function () {
        editSession(this);
    });
    li.appendChild(editButton);
    toolbar.appendChild(li);

    li = document.createElement('li');
    var exportButton = newButton(sessionId, "exporticon", "导出会话");
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    exportButton.addEventListener("click", function () {
        exportSession(this.value);
    });
    li.appendChild(exportButton);
    toolbar.appendChild(li);
    
    li = document.createElement('li');
    var deleteButton = newButton(sessionId, "deleteicon", "删除会话");
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    deleteButton.addEventListener("click", function () {
        deleteSession(this.value);
    });
    li.appendChild(deleteButton);
    toolbar.appendChild(li);

    return toolbar;
}

function editSession(editButton) {
    var sessionId = editButton.value;
    var titleDiv = document.querySelector("#title_" + sessionId);
    var text = titleDiv.innerHTML;
    var textarea = document.createElement("textarea");
    textarea.id = "titletext_" + sessionId;
    textarea.classList.add("chatgpt-textare");
    textarea.innerHTML = text;
    // 为 textarea 绑定按键事件处理函数
    textarea.onkeydown = textareaKeyDown;
    titleDiv.parentNode.replaceChild(textarea, titleDiv);
    textarea.select();
    // 创建并添加confirmButton和cancelButton
    const confirmButton = newButton(sessionId, "confirmicon", "确认");
    // confirmButton.innerText = '√';
    confirmButton.id = "confirm_" + sessionId;
    confirmButton.addEventListener('click', confirmEdit);

    const cancelButton = newButton(sessionId, "cancelicon", "取消")
    // cancelButton.innerText = '×';
    cancelButton.id = "cancel_" + sessionId;
    cancelButton.addEventListener('click', cancelEdit);

    editButton.style.display = "none";
    editButton.parentNode.insertBefore(confirmButton, editButton);
    editButton.parentNode.insertBefore(cancelButton, editButton);

    // textarea 按键事件处理函数
    function textareaKeyDown(event) {
        if (event.keyCode === 13) {
            // 如果按下的是回车键，执行确认按钮点击事件处理函数
            confirmEdit();
        } else if (event.keyCode === 27) {
            // 如果按下的是 Escape 键，执行取消按钮点击事件处理函数
            cancelEdit();
        }
    }

    function confirmEdit() {
        // 获取textarea
        const textarea = document.querySelector('#titletext_' + sessionId);
        var newTitle = textarea.value;
        var sessionItem = _sessions[sessionId];
        sessionItem.title = newTitle;
        updateSessionsToStorage();

        // 将textarea中的内容放回到div中
        titleDiv.innerHTML = newTitle;

        // 将textarea替换为标题div
        textarea.parentNode.replaceChild(titleDiv, textarea);
        // 显示editButton按钮
        editButton.style.display = 'block';
        confirmButton.parentNode.removeChild(confirmButton);
        cancelButton.parentNode.removeChild(cancelButton);
    }

    function cancelEdit() {
        const textarea = document.querySelector('#titletext_' + sessionId);
        // 将textarea替换为标题div
        textarea.parentNode.replaceChild(titleDiv, textarea);

        // 显示editButton按钮
        editButton.style.display = 'block';
        confirmButton.parentNode.removeChild(confirmButton);
        cancelButton.parentNode.removeChild(cancelButton);
    }
}

function exportSession(sessionId){
    var sessionItem = _sessions[sessionId];
    exportJsonToFile(sessionItem, sessionItem.title + sessionId + ".session");
}

function deleteSession(sessionId) {
    //弹出提示确认清除，如果不确认则跳过
    if (confirm("是否确定要删除该会话？")) {
        //执行删除session的操作
        delete _sessions[sessionId];
        deleteElement(sessionId);
        updateSessionsToStorage();
        //如果当前Session为要删除的Session，则创建新Session
        if (_currentSessionId == sessionId) {
            newSession();
        }
    } else {
        //跳过操作
    }
}

//更新Session列表信息
function updateSessionListItem(sessionId, sessionItem) {
    if (sessionItem == null) {
        sessionItem = _sessions[sessionId];
    }
    setSessionItem(sessionId, sessionItem.title, sessionItem.preview, sessionItem.time);
    function setSessionItem(id, title, preview, time) {
        //对Id为id的li元素下的内容赋值，将该li下class为"title"的div元素内容设为title，将该li下class为"preview"的div元素内容设为preview，且内容长度过长时自动截断。
        const li = document.getElementById(id);
        if (li) {
            const titleEl = li.querySelector('.title');
            const previewEl = li.querySelector('.preview');
            const timeEl = li.querySelector('.time');
            const maxLength = 10;
            if (titleEl && title) {
                titleEl.innerHTML = title;
                titleEl.title = title;
            }
            if (previewEl && preview) {
                previewEl.innerHTML = preview;
            }
            if (timeEl) {
                timeEl.innerHTML = getDateTimeString(time);
            }
        }
    }
}

function changeSession(sessionId) {
    _currentSessionId = sessionId;
    initSession();
    updateSessionsToStorage();
}

function updateSessionsToStorage() {
    storeToLocal("sessions", _sessions);
}

function newSession() {
    initNewSession();
    initSession();
    return
}

function initNewSession() {
    var sessionId = generateGUID();
    _currentSessionId = sessionId;
    var session = createSession();
    _currentSession = session;
    _tempSessions[sessionId] = session;
    return sessionId;
}

function initSession() {
    if (_sessions.lastSessionId == null) {
        initNewSession();
    }
    //更新当前Session，如果_sessions中不包含_currentSessionId，说明是新建的Session
    if (_currentSessionId != _sessions.lastSessionId) {
        var session = _sessions[_currentSessionId];
        if (session != null) {
            _sessions.lastSessionId = _currentSessionId;
            _currentSession = session.session;
        }
    }
    printSystem(_currentSession.system);
    var chatWindow = document.getElementById('chatgpt-session');
    var scrollBtns = chatWindow.querySelectorAll("#chatgpt-session .mediumicon");
    scrollBtns.forEach(button => {
        chatWindow.removeChild(button);
    });
    chatWindow.innerHTML = "";
    scrollBtns.forEach(button => {
        chatWindow.appendChild(button);
    });
    if (_currentSession.conversations == null || _currentSession.conversations.length == 0) {
    }
    else {
        //从session数组中遍历，并将每个成员的role和content调用printMessage输出
        for (let i = 0; i < _currentSession.conversations.length; i++) {
            const conversation = _currentSession.conversations[i];
            printConversation(conversation);
        }
    }
    setElementActive(_currentSessionId);
    printStatus(`欢迎使用`, false);
}

function appendPromptToSession(prompt, promptId, sessionId) {
    return appendSession("user", prompt, promptId, promptId, 0, 0, 0, false, sessionId);
}

function updateSystemToSession(message) {
    _currentSession.system = message;
    updateSessionsToStorage();
}

class Conversation {
    constructor(role, content, promptId, chatId, timeDiff, index, tokenUsed, filtered) {
        this.role = role;
        this.content = content;
        this.promptId = promptId;
        this.chatId = chatId;
        this.timeDiff = timeDiff;
        //多个响应的顺序
        this.index = index;
        this.tokenUsed = tokenUsed;
        this.filtered = filtered;
    }
}

function appendSession(role, content, promptId, chatId, timeDiff, index, tokenUsed, filtered, sessionId) {
    var sessionItem = _sessions[sessionId];
    if (sessionItem.sessionId == null) {
        //老版本的session没有sessionId，这里更新一下
        sessionItem.sessionId = sessionId;
    }
    if (sessionItem == null) {
        //说明是新建的会话
        sessionItem = createSessionItem(_tempSessions[sessionId], sessionId);
        _sessions[sessionId] = sessionItem;
        appendSessionListItem(sessionId);
        if (sessionId == _currentSessionId) {
            _sessions.lastSessionId = _currentSessionId;
            setElementActive(_currentSessionId);
        }
    }
    if (!sessionItem.titleSetted) {
        sessionItem.title = sessionItem.session.system;
        sessionItem.titleSetted = true;
    }
    sessionItem.preview = content;
    sessionItem.time = new Date();
    updateSessionListItem(sessionId, sessionItem);

    var session = sessionItem.session;
    var conversation = new Conversation(role, content, promptId, chatId, timeDiff, index, tokenUsed, filtered);
    session.conversations.push(JSON.parse(JSON.stringify(conversation)));

    updateSessionsToStorage();
    return conversation;
}

function printConversation(conversation) {
    printMessage(conversation.content, conversation.role, conversation.chatId, conversation.promptId, conversation.index, conversation.filtered);
}

function printError(error, promptId) {
    printMessage(error, "error", "", promptId, 0, true);
}

// Define printMessage function
function printMessage(content, role, chatId, promptId, index, filtered) {
    var converstaionContainerId = role + promptId;
    var conversationContainer = document.getElementById(converstaionContainerId);
    if (conversationContainer == null) {
        conversationContainer = document.createElement('div');
        conversationContainer.classList.add("chatgpt-conversation");
        conversationContainer.id = converstaionContainerId;
    }

    var containerDiv = document.createElement('div');
    containerDiv.classList.add("chatgpt-" + role);
    containerDiv.classList.add("chatgpt-box");
    containerDiv.classList.add("chatgpt-box-" + (!isNaN(index) ? index : 0).toString());
    conversationContainer.appendChild(containerDiv);

    var toolbar = buildupSessionToolbar(chatId, promptId, filtered);
    containerDiv.appendChild(toolbar);

    var messageDiv = document.createElement('div');
    messageDiv.className = "chatgpt-message";
    messageDiv.innerHTML = formatMessage(content);
    containerDiv.appendChild(messageDiv);

    var chatWindow = document.getElementById('chatgpt-session');
    chatWindow.appendChild(conversationContainer);
    //自动滚动到chatWindow的最下方
    chatWindow.scrollTop = chatWindow.scrollHeight;

    //只有鼠标挪到containerDiv上，toolbar才会显示
    // toolbar.style.display = "none";
    // containerDiv.addEventListener("mouseover", function() {
    //     toolbar.style.display = "block";
    //   });
    //   containerDiv.addEventListener("mouseout", function() {
    //     toolbar.style.display = "none";
    //   });
}

function buildupSessionToolbar(chatId, promptId, filtered){
    var toolbar = document.createElement('ol');
    toolbar.classList.add("chatgpt-toolbar");

    var li = document.createElement('li');
    let newCheckbox = document.createElement("input");
    if (chatId != promptId) {
        //说明是响应
        newCheckbox.type = "checkbox";
    }
    else{
        newCheckbox.type = "checkbox";
    }
    newCheckbox.name = promptId;
    newCheckbox.checked = !filtered;
    newCheckbox.value = chatId;
    newCheckbox.className = "message-check";
    //当newCheckbox的选中状态改变时，执行方法messageFilter，传入newCheckBox的value和选中状态；
    newCheckbox.addEventListener('change', function () {
        filterMessage(this.value, this.checked);
    });
    li.appendChild(newCheckbox);
    toolbar.appendChild(li);

    var li = document.createElement('li');
    var deleteButton = newButton(chatId, "deleteicon", "删除");
    //为deleteButton添加click事件响应deleteSession，并把deleteButton的value传给该函数
    deleteButton.addEventListener("click", function () {
        deleteMessage(this.value);
    });
    li.appendChild(deleteButton);
    toolbar.appendChild(li);

    var li = document.createElement('li');
    var sendButton = newButton(chatId, "sendicon", "编辑后重新发送");
    sendButton.addEventListener("click", function () {
        sendMessage(this.value);
    });
    li.appendChild(sendButton);
    toolbar.appendChild(li);

    var li = document.createElement('li');
    var refreshButton = newButton(promptId, "refreshicon", "刷新");
    refreshButton.addEventListener("click", function () {
        refreshMessage(this.value);
    });
    li.appendChild(refreshButton);
    toolbar.appendChild(li);

    return toolbar;
}

//对信息做过滤
function filterMessage(chatId, checked) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversation = _currentSession.conversations[i];
        if (conversation.chatId == chatId) {
            //从_currentSession.conversations中移除conversion
            conversation.filtered = !checked;
            break;
        }
    }
}

//对信息做过滤
function deleteMessage(messageId) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversation = _currentSession.conversations[i];
        if (conversation.chatId == messageId) {
            //从_currentSession.conversations中移除conversion
            _currentSession.conversations.splice(i, 1);
            break;
        }
    }
    updateSessionsToStorage();
    initSession();
}

//编辑后重发消息
function sendMessage(messageId) {
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversation = _currentSession.conversations[i];
        if (conversation.chatId == messageId) {
            setInput(conversation.content);
            break;
        }
    }
}

//直接重发消息，并清除历史消息
function refreshMessage(promptId) {
    var refreshContent = null;
    //遍历_currentSession下的conversions
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversation = _currentSession.conversations[i];
        if (conversation.promptId == promptId || conversation.chatId == promptId) {
            _currentSession.conversations.splice(i, 1);
            //因为删除了一条记录，所以i--；
            i--;
            if (conversation.chatId == promptId) {
                refreshContent = conversation.content;
            }
        }
    }
    updateSessionsToStorage();
    initSession();
    if (refreshContent != null) {
        callChatGPT(refreshContent);
    }
}

function getSelectedNumber() {
    //获取id为chatgpt-responsenumber的select的选中项值，并赋值给数字n。
    const selectElement = document.getElementById("chatgpt-responsenumber");
    return parseInt(selectElement.value);
}

async function sendPrompt() {
    var input = document.getElementById("chatgpt-input")
    var prompt = input.value;
    if (prompt == "") {
        prompt = __defaultRequest;
    }
    input.value = "";
    callChatGPT(prompt);
}

var _currentXhr = null;

// Define callCHATGPT async function
async function callChatGPT(prompt) {
    var n = getSelectedNumber();

    updateButtonState(0);
    //记录当前SessionId，避免切换Session后记录串了。
    var sessionId = _currentSessionId;

    const startTime = performance.now();
    xhr = buildCallXhr();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const endTime = performance.now(); // 记录结束时间
            const timeDiff = endTime - startTime; // 计算时间差
            var tokenUsed = 0;
            if (xhr.status === 200) {
                var json = JSON.parse(xhr.responseText);
                //遍历json.choices
                for (let i = 0; i < json.choices.length; i++) {
                    var choice = json.choices[i];
                    var chatId = json.id + i;
                    var message = choice.message;
                    var response = choice.message.content;
                    var filtered = i != 0;
                    updatePromptUsage(promptId, json.usage.prompt_tokens - currentConversation.totalToken, sessionId);
                    var conversation = appendSession(message.role, response, promptId, chatId, timeDiff, i, json.usage.completion_tokens, filtered, sessionId);
                    if (sessionId == _currentSessionId) {
                        printConversation(conversation);
                    }
                }
                tokenUsed = json.usage.total_tokens;
                console.info(xhr.responseText);
            }
            else if (xhr.responseText != '') {
                var json = JSON.parse(xhr.responseText);
                var response = json.error.message;
                if (sessionId == _currentSessionId) {
                    printError(response, promptId);
                }
                console.error(xhr.responseText);
            }
            showStatus(timeDiff, tokenUsed);
            updateButtonState(1);
            _currentXhr = null;
        }
    };
    xhr.onabort = function () {
        printStatus(`请求已取消`, false);
        updateButtonState(1);
        _currentXhr = null;
    }
    xhr.onerror = function () {
        var errorMessage = "Request failed."
        if (xhr.status === 0) {
            // 请求失败
        } else {
            // 其他错误
            errorMessage = "System error."
        }
        printError(errorMessage, promptId);
        console.error(errorMessage);
    };
    _currentXhr = xhr;

    var promptId = generateGUID();
    var conversation = appendPromptToSession(prompt, promptId, sessionId);
    //将问题上屏。
    printConversation(conversation);

    var currentConversation = generateConversations();
    var data = buildCallPlayload(currentConversation.conversations, n);
    console.log(data);
    await printStatus(`使用 Token 约：${currentConversation.totalToken}；计划生成回复数：${n} `, true);
    await xhr.send(data);
}

function cancelPrompt() {
    if (_currentXhr != null) {
        _currentXhr.abort();
    }
}

function updatePromptUsage(promptId, tokenUsed, sessionId) {
    var session = null;
    if (sessionId == _currentSessionId) {
        session = _currentSession;
    } else {
        session = _sessions[sessionId].session;
    }
    for (let i = 0; i < session.conversations.length; i++) {
        var conversation = session.conversations[i];
        if (conversation.chatId == promptId) {
            conversation.tokenUsed = tokenUsed;
            break;
        }
    }
}

function generateConversations() {
    var conversations = [];
    var totalToken = 0;
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        var conversation = _currentSession.conversations[i];
        if (!conversation.filtered) {
            conversations.push({ "role": conversation.role, "content": conversation.content });
            totalToken += conversation.tokenUsed ? conversation.tokenUsed : 0;
        }
    }
    //将System添加到conversations列表的倒数第二位，有助于始终绑定人设。
    if (_currentSession.system != null) {
        conversations.splice(-1, 0, { "role": "system", "content": _currentSession.system });
    }
    return { "conversations": conversations, "totalToken": totalToken };
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
        updateSessionsToStorage();
        initSessions();
        newSession();
    } else {
        //跳过操作
    }
}

//弹窗提示选择文件，将选中的文件内容解析为json
function importSessions() {
    const input = document.createElement('input');
    input.type = 'file';

    input.onchange = (event) => {
        const selectedFile = event.target.files[0];

        // 通过FileReader对象读取用户选中的文件内容
        let reader = new FileReader();
        reader.readAsText(selectedFile);

        reader.onload = () => {
            const fileContent = reader.result;
            const importSessions = JSON.parse(fileContent);
            let currentsessionChanged = false;
            if(importSessions.hasOwnProperty("lastSessionId")){
                //说明是一系列Sesssion
                if (_sessions.lastSessionId == null) {
                    _currentSessionId = importSessions.lastSessionId
                    currentsessionChanged = true;
                }
                //遍历importSessions的所有属性，如果_sessions有此属性，则跳过，否则为_sessions添加该属性。
                for (const property in importSessions) {
                    if (property != "lastSessionId") {
                        if (_sessions.hasOwnProperty(property)) {
                            continue;
                        }
                        _sessions[property] = importSessions[property];
                    }
                }
            }
            else if (importSessions.hasOwnProperty("sessionId")) {
                let sessionId = importSessions.sessionId;
                //说明是一个Session
                if (_sessions.hasOwnProperty(sessionId)) {
                    if(!confirm(`会话"${importSessions.title}"存在，是否覆盖?`)){
                        return;
                    }
                }
                _sessions[sessionId] = importSessions;
                currentsessionChanged = sessionId == _currentSessionId;
                if(currentsessionChanged){
                    //更新下当前的会话
                    _currentSession = importSessions.session;
                }
            }
            else {
                return;
            }
            initSessions();
            if(currentsessionChanged){
                initSession();
            }
            updateSessionsToStorage();
        };
    };

    input.click();
}

//将json对象_sessions导出为文件，并下载。
function exportSessions() {
    exportJsonToFile(_sessions, "sessions.session");
}

function clearSession() {
    //弹出提示确认清除，如果不确认则跳过
    if (confirm("是否确定要清除当前历史对话？")) {
        //执行清除session的操作
        _currentSession.conversations.length = 0;
        var sessionItem = _sessions[_currentSessionId];
        // sessionItem.title = "New Chat";
        // sessionItem.titleSetted = false;
        updateSessionListItem(_currentSessionId, sessionItem);
        initSession();
        updateSessionsToStorage();
    } else {
        //跳过操作
    }
}

// 定义按钮点击事件处理函数
function systemInputModeChange() {
    const inputTextarea = document.getElementById('chatgpt-systeminput');
    const editModeBtn = document.getElementById('chatgpt-systemedit');
    if (inputTextarea.readOnly) {
        inputTextarea.removeAttribute('readonly');
        inputTextarea.focus();
        inputTextarea.select();
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

//将json对象_currentSessions导出为文件，提示选择位置下载。
function exportCurrentSession() {
    // Convert JSON object to string
    const content = convertToMarkdown(_currentSession);
    exportStringToFile(content, "session.md");
}

function convertToMarkdown(session) {
    var content = "";
    content += appendMessage("configuration", session.system);
    for (i = 0; i < session.conversations.length; i++) {
        content += appendMessage(session.conversations[i].role, session.conversations[i].content);
    }

    function appendMessage(role, message) {
        return "## " + role + "\n\n" + message + "\n\n";
    }
    return content;
}

//#region Initialization 
var _inited = false;

function init() {
    if (!_inited) {
        _inited = true;
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
        //设置各按钮事件。
        document.getElementById("chatgpt-input").addEventListener("keydown", inputEnter);
        document.getElementById("chatgpt-sumit").addEventListener("click", sendPrompt);
        document.getElementById("chatgpt-cancel").addEventListener("click", cancelPrompt);
        document.getElementById("chatgpt-clear").addEventListener("click", clearSession);
        document.getElementById("chatgpt-systemedit").addEventListener("click", systemInputModeChange);
        document.getElementById("chatgpt-exportsession").addEventListener("click", exportCurrentSession);
        document.getElementById("chatgpt-checkmessages").addEventListener("change", togglefilter);

        document.getElementById("chatgpt-clearAll").addEventListener("click", clearSessions);
        document.getElementById("chatgpt-newSession").addEventListener("click", newSession);
        document.getElementById("chatgpt-importSessions").addEventListener("click", importSessions);
        document.getElementById("chatgpt-exportSessions").addEventListener("click", exportSessions);
    }

    function inputEnter(event) {
        if (event.key == 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendPrompt();
        }
    }
    
}

function togglefilter(){
    var filtered = !this.checked;
    for (let i = 0; i < _currentSession.conversations.length; i++) {
        const conversation = _currentSession.conversations[i];
        conversation.filtered = filtered;
    }
    updateSessionsToStorage();
    initSession();
}

window.onload = function () {
    interactive_init();
    init();
};
//#endregion