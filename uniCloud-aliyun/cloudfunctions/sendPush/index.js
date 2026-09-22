'use strict';

const uniPush = uniCloud.getPushManager({appId: "__UNI__19BA6D3"});

exports.main = async (event, context) => {
    let requestData = event;
    if (event.body) {
        try {
            requestData = JSON.parse(event.body);
        } catch (e) {
            requestData = event.body;
        }
    }

    let cid = requestData.cid;
    let title = requestData.title || "新通知";
    let content = requestData.content || "您有一条新消息";
    let payload = requestData.payload || {};

    if (!cid) {
        return {
            code: 400,
            msg: "缺少必要的参数: cid"
        };
    }

    try {
        const result = await uniPush.sendMessage({
            "push_clientid": cid,
            "title": title,
            "content": content,
            "payload": payload,
            "force_notification": true
        });
        
        return {
            code: 200,
            msg: "推送发送成功",
            result: result
        };
    } catch (err) {
        return {
            code: 500,
            msg: "推送发送失败",
            error: err
        };
    }
};