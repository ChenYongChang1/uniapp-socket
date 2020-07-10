var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
 
app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
});
 
//在线用户
var onlineUsers = [];
//储存 id对应的socket对象 用来一对一
sockets={}

io.on('connection', function(socket){
    console.log('a user connected');
     
    //监听新用户加入
    /**
     * obj:{id:'',name:''}
     */
    socket.on('login', function(loginobj){
        let obj = JSON.parse(JSON.stringify(loginobj))
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        socket._id = obj.id;
        obj.typeClient = obj.typeClient || 's'
        //检查在线列表，如果不在里面就加入
        if(!onlineUsers.some(item => item.id === obj.id)) {
            onlineUsers.push({
                ...obj,
            })
            console.log(onlineUsers.length,'eeee');
            sockets[obj.id] = socket
        }
         
        //向所有typeClient = s 用户广播用户加入
        for(let i of onlineUsers){
            if(i.typeClient === 's'){
                sockets[i.id].emit('login', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
            }else{
                sockets[i.id].emit('login', {onlineUsers:onlineUsers.filter(item => item.typeClient === 'c')});
            }
        }
        // const resvId = onlineUsers.find(item => item.name == obj.to)
        //     resvId && resvId.id && sockets[resvId.id].emit('message', obj);
        // io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
        console.log(obj.name+'加入了');
    });
     
    //监听用户退出
    socket.on('disconnect', function(){
        //将退出的用户从在线列表中删除
        if(onlineUsers.some(item => item.id === socket._id)) {
            //退出用户的信息
            // var obj = {id:socket._id, name:onlineUsers[socket._id]};
            var obj = JSON.parse(JSON.stringify(onlineUsers.find(item => item.id == socket._id)))
            //删除
            onlineUsers.splice(onlineUsers.findIndex(item => item.id == socket._id), 1)
             
            //typeClient = s 用户广播用户退出
            for(let i of onlineUsers){
                if(i.typeClient === 's'){
                    sockets[i.id].emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
                }
            }
            // io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineUsers.length, user:obj});
            // console.log(obj.name+'退出了');
        }
    });
    
    //监听用户发布广播
    socket.on('message', function(obj){
        //向所有登录客户端广播发布的消息
        // console.log();
        obj.toTypeClient = obj.toTypeClient || 's'
        if(obj.to == '-1'){
            for(let i of onlineUsers){
                console.log( i.typeClient , obj.toTypeClient);
                if(i.id && i.typeClient === obj.toTypeClient){
                    sockets[i.id].emit('message', obj);
                }
            }
            // io.emit('message', obj);
            console.log('广播',obj);
        }else{
            const resvId = onlineUsers.find(item => item.id == obj.to)
            resvId && resvId.id && sockets[resvId.id].emit('message', obj);
            console.log('1v1',obj);
        }
        
        
    });
   
});
 
http.listen(3028, function(){
    console.log('listening on *:3028');
});