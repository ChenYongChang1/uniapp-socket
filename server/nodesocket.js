var ws = require("nodejs-websocket");
const { text } = require("express");
console.log("开始建立连接...");

var server = ws
  .createServer(function (conn) {
    // console.log(conn);
    conn.on("text", function (str) {
      console.log("收到的信息为:" + str);
      if(str === '111'){
        textsend()
      }else{
        sendData(str);
      }
      
      
    });
    conn.on("close", function (code, reason) {
      console.log("关闭连接");
    });
    conn.on("error", function (code, reason) {
      console.log("异常关闭");
    });
  })
  .listen(3028);

function sendData(data) {
  server.connections.forEach((conn) => {
    conn.sendText(data);
  });
}

function textsend(){
    new Promise(function (resolve, reject) {
        setTimeout(async () => {
          await sendData(
            JSON.stringify({
              code: 200,
              data: {
                flag: true,
                num: 10,
              },
            })
          );
        }, 2000);
        resolve("成功"); // 数据处理完成
        // reject('失败') // 数据处理出错
      }).then(
        (res) => {
          setTimeout(() => {
            sendData(
              JSON.stringify({
                code: 200,
                data: {
                  flag: false,
                  num: 6,
                },
              })
            );
          }, 3000);
        } // 成功
      );
}
textsend()
console.log("WebSocket建立完毕");
