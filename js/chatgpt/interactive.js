var loadingInterval = null;

function printStatus(message, loading) {
    var statusLabel = document.getElementById('chatgpt-status');
    if (loading) {
        let i = 0;
        loadingInterval = setInterval(() => {
            statusLabel.innerText = `${message} 加载中，请等待${'.'.repeat(i % 6)}`;
            i++;
        }, 500);
    }
    else {
        clearInterval(loadingInterval);
        statusLabel.innerText = message;
    }
}

function printSystem(message) {
    var systemErea = document.getElementById('chatgpt-systeminput');
    systemErea.value = message;
}

function setInput(message) {
    var input = document.getElementById("chatgpt-input");
    input.value = message;
    input.focus();
}

// Define showTimeDiff function
function showStatus(timeDiff, tokenUsed) {
    timeDiff = (timeDiff / 1000).toFixed(2);
    cost = (tokenUsed / 10 * 0.002).toFixed(4);
    printStatus(`本次请求用时：${timeDiff} 秒；` + `使用 Token：${tokenUsed}；` + `花费：${cost} 美分`), false;
}

//更新按钮状态，确保按钮不会被重复按下
function updateButtonState(state) {
    const submit = document.querySelector("#chatgpt-sumit");
    const cancel = document.querySelector("#chatgpt-cancel");
    if (state == 0) {
        cancel.classList.remove("d-none");
        submit.classList.add("d-none");
    }
    else {
        cancel.classList.add("d-none");
        submit.classList.remove("d-none");
    }
}

function setElementActive(elementId) {
    var items = document.getElementsByClassName("active");
    if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.classList.remove("active");
        }
    }
    let element = document.getElementById(elementId);
    if (element != null) {
        element.classList.add("active");
    }
}

function deleteElement(sessionId) {
    let element = document.getElementById(sessionId);
    element.parentNode.removeChild(element);
}

function newButton(buttonValue, iconclass, title) {
    var button = document.createElement("button");
    button.classList.add('chatgpt-button', iconclass, "smallicon");
    button.setAttribute('autocomplete', 'off');
    button.title = title;
    button.value = buttonValue;
    return button;
}

function interactive_init(){
    var sidebutton = document.getElementById("toggle-sidebar-btn");
    var mainbutton = document.getElementById("toggle-main-btn");
    //为指示按钮添加点击事件的监听器
    sidebutton.addEventListener("click", toggleSidebar);
    mainbutton.addEventListener("click", toggleSidebar);
    var dnone = "d-none";
    function toggleSidebar() {
        //获取当前sidebar的显示状态
        const sidebar = document.getElementById("sidebar");
        const maincontent = document.getElementById("maincontent");
        const mainbuttonholder = document.getElementById("menubuttonholder-main");
        //如果sidebar已经隐藏，则显示它，否则隐藏它
        if (sidebar.classList.contains(dnone)) {
            sidebar.classList.remove(dnone);
            mainbuttonholder.classList.add(dnone);
            maincontent.classList.remove("full-width");
        } else {
            sidebar.classList.add(dnone);
            mainbuttonholder.classList.remove(dnone);
            maincontent.classList.add("full-width");
        }
    }

    var scrollDiv = document.getElementById('chatgpt-session');
    var scrollBtn = document.getElementById('chatgpt-scrollbtn');
    var scrollbtntobottom = document.getElementById('chatgpt-scrollbtntobottom');

    function toggleScrollBtn() {
        if (scrollDiv.scrollTop > 0) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
        if (scrollDiv.scrollTop + scrollDiv.offsetHeight+ 10 <= scrollDiv.scrollHeight) {
            scrollbtntobottom.style.display = 'inline-block'
        }
        else{
            scrollbtntobottom.style.display = 'none';
        }
    }

    scrollDiv.addEventListener('scroll', toggleScrollBtn);
    scrollBtn.addEventListener('click', scrollToTop);
    scrollbtntobottom.addEventListener('click', scrollToBottom);
    function scrollToTop() {
        scrollDiv.scrollTo({ top: 0, behavior: 'smooth' });
        scrollBtn.style.display = 'none';
    }

    function scrollToBottom() {
        scrollDiv.scrollTop = scrollDiv.scrollHeight
    }
}