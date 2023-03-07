//设置请求
function buildCallPlayload(messages, n) {
    var playload = {
        "messages": messages,
        "temperature": 1.2, //What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
        "top_p": 1, //An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
        "frequency_penalty": 0, //控制重复性；Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line
        "presence_penalty": 0, //控制重复性；Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
        "model": __openAIModel,
        "max_tokens": __maxToken,
        "stream": false, //Whether to stream back partial progress. If set, tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a data: [DONE] message.
        "n": n, //How many chat completion choices to generate for each input message.
        // "best_of": n,
        // "logit_bias": null, //Modify the likelihood of specified tokens appearing in the completion
    };
    var data = JSON.stringify(playload);
    return data;
}

function buildCallXhr() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", __openAIChatUrl, true);
    // xhr.open("POST", __openAIUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // 设置Key
    xhr.setRequestHeader("Authorization", _openAIKey);
    return xhr;
}
