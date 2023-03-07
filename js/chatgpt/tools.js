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

function getDateTimeString(time) {
    let dateTime = null;
    if(time == null){
        dateTime = new Date();
    }
    else {
        let n = Date.parse(time);
        //检查time是不是日期时间类型
        if (isNaN(n)) {
            return time.toString();
        }
        else {
            dateTime = new Date(n);
        }
    }

    // 获取所有需要的值（年份、月份、日期、小时数、分钟数、秒数）
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const date = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');
    // 数组连接成字符串，并以指定格式呈现
    const formattedString = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

    return formattedString;
}

// Define formatMessage function
function formatMessage(message) {
    const md = window.markdownit();
    return md.render(message);
}

function substringToLength(title, maxLength) {
    if (title.length > maxLength) {
        title = title.substr(0, maxLength) + '...';
    }
    return title;
}