var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.send("<h1>Welcome Realtime Server</h1>");
});

//对应房间
var rooms = {
  //在线用户
  public: [],
  my: [],
};

// var onlineUsers = [];
//储存 id对应的socket对象 用来一对一
sockets = {};

io.on("connection", function (socket) {
  console.log("a user connected");
  // userId name
  socket.on("creatroom", function (roomobj) {
    if(!rooms[roomobj.name]){
      rooms[roomobj.name] = []
      sockets[i.id].emit("creatroom", {data:'成功',code:200})
    }else{
      sockets[i.id].emit("creatroom", {data:'失败，已存在',code:201})
    }
    
  })
  //监听新用户加入
  /**
   * obj:{id:'',name:''}
   */
  socket.on("login", function (loginobj) {
    let obj = JSON.parse(JSON.stringify(loginobj));
    //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
    socket._id = obj.id;
    socket._roomId = obj.roomId;
    obj.typeClient = obj.typeClient || "s";
    if (!rooms[obj.roomId]) {
      return;
    }

    //检查在线列表，如果不在里面就加入
    if (!rooms[obj.roomId].some((item) => item.id === obj.id)) {
      rooms[obj.roomId].push({
        ...obj,
      });
      console.log(rooms[obj.roomId].length, "eeee");
      sockets[obj.id] = socket;
    }

    //向所有typeClient = s 用户广播用户加入
    for (let i of rooms[obj.roomId]) {
      if (i.typeClient === "s") {
        sockets[i.id].emit("login", {
          onlineUsers: rooms[obj.roomId],
          onlineCount: rooms[obj.roomId].length,
          user: obj,
        });
      } else {
        sockets[i.id].emit("login", {
          onlineUsers: rooms[obj.roomId].filter(
            (item) => item.typeClient === "c"
          ),
        });
      }
    }
    // const resvId = onlineUsers.find(item => item.name == obj.to)
    //     resvId && resvId.id && sockets[resvId.id].emit('message', obj);
    // io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
    console.log(obj.name + "加入了");
  });

  //监听用户退出
  socket.on("disconnect", function () {
    //将退出的用户从在线列表中删除
    if (!rooms[socket._roomId]) {
      return;
    }
    if (rooms[socket._roomId].some((item) => item.id === socket._id)) {
      //退出用户的信息
      // var obj = {id:socket._id, name:onlineUsers[socket._id]};
      var obj = JSON.parse(
        JSON.stringify(
          rooms[socket._roomId].find((item) => item.id == socket._id)
        )
      );
      //删除
      rooms[socket._roomId].splice(
        rooms[socket._roomId].findIndex((item) => item.id == socket._id),
        1
      );

      //typeClient = s 用户广播用户退出
      for (let i of rooms[socket._roomId]) {
        if (i.typeClient === "s") {
          sockets[i.id].emit("logout", {
            onlineUsers: rooms[socket._roomId],
            onlineCount: rooms[socket._roomId].length,
            user: obj,
          });
        }
      }
      // io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
      // console.log(obj.name+'退出了');
    }
  });

  //监听用户发布广播
  socket.on("message", function (obj) {
    //向所有登录客户端广播发布的消息
    try {
      obj.toTypeClient = obj.toTypeClient || "s";
      if (obj.to == "-1") {
        for (let i of rooms[sockets[obj.id]._roomId]) {
          console.log(i.typeClient, obj.toTypeClient);
          if (i.id && i.typeClient === obj.toTypeClient) {
            sockets[i.id].emit("message", obj);
          }
        }
        // io.emit('message', obj);
        console.log("广播", obj);
      } else {
        let onlineUsers = [];
        for (let i in rooms) {
          onlineUsers.push(...rooms[i]);
        }
        const resvId = onlineUsers.find((item) => item[obj.userType] == obj.to);
        resvId && resvId.id && sockets[resvId.id].emit("message", obj);
        console.log("1v1", obj);
      }
    } catch (d) {}
  });
});

http.listen(3028, function () {
  console.log("listening on *:3028");
});
