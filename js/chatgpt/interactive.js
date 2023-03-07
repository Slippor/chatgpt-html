let _loadingInterval = null;

function printStatus(message, loading) {
    const statusLabel = document.getElementById('chatgpt-status');
    if (loading) {
        let i = 0;
        _loadingInterval = setInterval(() => {
            statusLabel.innerText = `${message} 加载中，请等待${'.'.repeat(i % 6)}`;
            i++;
        }, 500);
    }
    else {
        clearInterval(_loadingInterval);
        statusLabel.innerText = message;
    }
}

function printSystem(message) {
    const systemErea = document.getElementById('chatgpt-systeminput');
    systemErea.value = message;
}

function setInput(message) {
    const input = document.getElementById("chatgpt-input");
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
    let items = document.getElementsByClassName("active");
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
    const button = document.createElement("button");
    button.classList.add('chatgpt-button', iconclass, "smallicon");
    button.setAttribute('autocomplete', 'off');
    button.title = title;
    button.value = buttonValue;
    return button;
}
//将json对象导出为文件，并下载。
function exportFile(exportItem, fileName) {
    // create a link for download and click it programmatically
    const downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.href = URL.createObjectURL(exportItem);
    // Prompt user to download the file.
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function exportJsonToFile(jsonObject, fileName){
    const blob = new Blob([JSON.stringify(jsonObject)], {
        type: "application/json",
    });
    exportFile(blob, fileName);
}

function exportStringToFile(stringObject, fileName){
    const blob = new Blob([stringObject], {
        type: "application/txt",
    });
    exportFile(blob, fileName);
}

function interactive_init(){
    const sidebutton = document.getElementById("toggle-sidebar-btn");
    const mainbutton = document.getElementById("toggle-main-btn");
    //为指示按钮添加点击事件的监听器
    sidebutton.addEventListener("click", toggleSidebar);
    mainbutton.addEventListener("click", toggleSidebar);
    const dnone = "d-none";
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

    const scrollDiv = document.getElementById('chatgpt-session');
    const scrollBtn = document.getElementById('chatgpt-scrollbtn');
    const scrollbtntobottom = document.getElementById('chatgpt-scrollbtntobottom');

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