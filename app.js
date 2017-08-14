var http = require('http');
// 导入 express 模块
var express = require('express');
// 创建 express 的服务器实例
var app = express();
// 1. 导入 WebSocket 模块
var WebSocket = require('ws');
// 处理时间的模块
var moment = require('moment');
// 进行HTML转义的模块
var escapeGoat = require('escape-goat');

// 托管静态资源
app.use(express.static('views'));
app.use('/node_modules', express.static('node_modules'));

// 创建一个 http 的server，如果请求类型是普通的HTTP请求，则交给 express 服务器去处理，如果请求类型是WebSocket类型的请求，那么交给 WebSocket 服务器去处理
const server = http.createServer(app);
// 创建一个 webSocket 服务器
const wss = new WebSocket.Server({ server });

// 默认有0个客户端连接进来
var count = 0;
// 监听 webSocket 服务器的请求
wss.on('connection', (ws, req) => {
  count++;
  // 每当有客户端连接进来之后，先获取客户端的IP地址
  const ip = req.connection.remoteAddress;
  // 将每个客户端自己的Ip地址，绑定到每个客户端身上
  ws.ip = ip;

  wss.broadcast('系统消息', '欢迎' + ip + '进入聊天室', 2);

  // 为每个客户端注册 message，接受发送过来的消息
  ws.on('message', (msg) => {
    var msgObj = JSON.parse(msg);

    // 循环向每个客户端发送消息
    wss.broadcast(msgObj.name, msgObj.msg);
  });

  // 每当客户端断开连接的时候，让count--
  ws.on('close', () => {
    count--;
  });
});

// 多播
// 规定字段：
// type：消息类型  1代表 用户消息；  2代表 系统消息
// time：消息发送时间
// sender：消息的发送者
// msg：具体的消息
// count：当前在线用户个数
wss.broadcast = function (sender, msg, type) {
  // 如果没有传递消息类型，则默认是用户消息
  if (!type) {
    type = 1;
  }

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: type,
        time: moment().format('YYYY-MM-DD HH:mm:ss'),
        sender: escapeGoat.escape(sender),
        msg: escapeGoat.escape(msg),
        count: count
      }));
    }
  });
};

// 调用 server.listen 方法，指定端口号并启动web服务器
server.listen(3001, '192.168.1.103', function listening() {
  console.log('Express server running at http://192.168.1.103:3001');
});