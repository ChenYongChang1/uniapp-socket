var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

class Response {
  setResponse(code, data, msg) {
    return { code: code, data: data, msg: msg };
  }
  success(data, code = 200, msg = "操作成功") {
    return this.setResponse(code, data, msg);
  }
  error(data, code = 201, msg = "操作成功") {
    return this.setResponse(code, data, msg);
  }
}

class Room {
  constructor() {
    this.rooms = [
      {
        id: "public",
        roomName: "public",
        key: "",
        userList: [],
      },
    ];
  }
  /**
   * @param {userId:'用户id', name: '房间名字'} room
   */
  createRoom(room) {
    // 检查房间是否存在
    let flag = this.checkRoom(room);
    if (!flag) {
      this.rooms.push({
        id: Math.random() + "",
        roomName: room.roomName || "",
        key: room.key || "",
        userList: [],
      });
    }
    return flag;
  }
  /**
   * 进入房间
   * @param {user:'用户信息', name:'房间名称', key:'房间密码'} obj
   */
  comeinroom(obj) {
    let room = this.checkRoom(obj);
    if (room && obj.key === room.key) {
      room.userList.push(obj.user);
      return true;
    }
    return false;
  }
  deleteRoom(room) {
    let flag = this.checkRoom(room);
    if (flag) {
      let index = this.rooms.findIndex(
        (item) => item.roomName === room.roomName
      );
      this.rooms.splice(index, 1);
    }
  }
  checkRoom(room) {
    console.log(room,'room');
    return (
      this.rooms.some((item) => item.roomName === room.roomName) &&
      this.rooms.find((item) => item.roomName === room.roomName)
    );
  }
}

class User {
  constructor(user = {}) {
    this.info = user;
  }
  setUser(user) {
    this.info = user;
  }
  relation(name, value) {
    this.info[name] = value;
  }
}

class Sokcet {
  constructor(socket) {
    this._socket = socket;
    this._id = "";
    this._roomName = "";
  }
  setSocketUser(user) {
    this._id = user.id;
    this._roomName = user.roomName;
  }
  watch(type, call) {
    return this._socket.on(type, (obj) => {
      call && call(obj);
    });
  }
  remain(type, data) {
    return this._socket.emit(type, data);
  }
}

let _room = new Room();
let allUser = [] // 所有用户包含没有进入房间

io.on("connection", function (socket) {
  console.log("a user connected");
  let _response = new Response();
  let _socket = new Sokcet(socket);
  let _user = new User();

  _socket.watch("createroom", (obj) => {
    console.log("createroom");
    let flag = _room.createRoom(obj);
    if (!flag) {
      for (let i of allUser) {
        i.socket.remain(
          "createroom",
          _response.success(
            _room.rooms.map((item) => {
              return {
                id: item.id,
                roomName: item.roomName,
              };
            })
          )
        );
      }
    }else{
      _socket.remain('createroom', _response.error("", 205, "房间已存在"))
    }
  });

  _socket.watch("getroom", () => {
    console.log("getroom");
    _socket.remain(
      "getroom",
      _response.success(
        _room.rooms.map((item) => {
          return {
            id: item.id,
            roomName: item.roomName,
          };
        })
      )
    );
  });

  //id name typeClient: s|c
  _socket.watch("login", (userObj) => {
    let obj = JSON.parse(JSON.stringify(userObj));
    _user.setUser({ ...obj, typeClient: obj.typeClient || "s" });
    _socket.remain("login", _response.success(obj));
    _user.relation("socket", _socket);
    allUser.push(_user.info)
  });
  // roomName:'', key:'', ...user
  _socket.watch("comeinroom", (user_room) => {
    let nowRoom = _room.checkRoom(user_room);
    if (nowRoom) {
      _user.relation("key", user_room.key);
      _user.relation("roomName", user_room.roomName);
      
      let status = _room.comeinroom(_user.info);
      if (status) {
        //向所有typeClient = s 用户广播用户加入
        console.log(nowRoom);
        for (let i of nowRoom.userList) {
          if(!i){
            continue
          }
          if (i.typeClient === "s") {
            i.socket.remain(
              "comeinroom",
              _response.success({
                onlineUsers: nowRoom.userList,
                onlineCount: nowRoom.userList.length,
                user: obj,
              })
            );
          } else {
            i.socket.remain(
              "comeinroom",
              _response.success({
                onlineUsers: nowRoom.userList.filter(
                  (item) => item.typeClient === "c"
                ),
              })
            );
          }
        }
      } else {
        _socket.remain("comeinroom", _response.error("", 205, "房间密码错误"));
      }
    } else {
      _socket.remain("comeinroom", _response.error("", 204, "没有这个房间"));
    }
  });

  _socket.watch("disconnect", () => {
    if (!_user.info.roomName) {
      return;
    }
    let roomObj = _room.find((item) => item.roomName === _user.info.roomName);
    roomObj.userList.filter((item) => item.id !== _user.info.id);
    for (let i of roomObj.userList) {
      if (i.typeClient === "s") {
        // remain("message", _response.success(obj));
        i.socket.remain(
          "logout",
          _response.success({
            onlineUsers: roomObj.userList,
            onlineCount: roomObj.userList.length,
            user: _user.info,
          })
        );
      }
    }
  });

  //监听用户发布广播
  _socket.watch("message", function (obj) {
    obj.toTypeClient = obj.toTypeClient || "s";
    let roomNow = _room.checkRoom(obj);
    if (obj.to == "-1") {
      for (let i of roomNow.userList) {
        if (i.id && i.typeClient === obj.toTypeClient) {
          i.socket.remain("message", _response.success(obj));
        }
      }
      console.log("广播", obj);
    } else {
      let onlineUsers = [];
      for (let i in _room) {
        onlineUsers.push(..._room[i].userList);
      }
      const resvId = onlineUsers.find((item) => item[obj.userType] == obj.to);
      resvId &&
        resvId.id &&
        resvId.socket.remain("message", _response.success(obj));
      console.log("1v1", obj);
    }
  });
});

http.listen(3028, function () {
  console.log("listening on *:3028");
});
