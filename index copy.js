var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
 
app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
});
 
//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;
 
io.on('connection', function(socket){
    console.log('a user connected');
     
    //监听新用户加入
    /**
     * obj:{id:'',name:''}
     */
    socket.on('login', function(obj){
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket._id = obj.id;
         
        //检查在线列表，如果不在里面就加入
        if(!onlineUsers.hasOwnProperty(obj.id)) {
            onlineUsers[obj.id] = obj.name;
            //在线人数+1
            onlineCount++;
        }
         
        //向所有客户端广播用户加入
        io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        console.log(obj.name+'加入了');
    });
     
    //监听用户退出
    socket.on('disconnect', function(){
        //将退出的用户从在线列表中删除
        if(onlineUsers.hasOwnProperty(socket._id)) {
            //退出用户的信息
            var obj = {id:socket._id, name:onlineUsers[socket._id]};
             
            //删除
            delete onlineUsers[socket._id];
            //在线人数-1
            onlineCount--;
             
            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
            console.log(obj.name+'退出了');
        }
    });
    
    //监听用户发布广播
    socket.on('message', function(obj){
        //向所有客户端广播发布的消息
        console.log(io.connections,socket.connections,'io');
        io.emit('message', obj);
        console.log('广播',obj);
    });
   
});
 
http.listen(3028, function(){
    console.log('listening on *:3028');
});