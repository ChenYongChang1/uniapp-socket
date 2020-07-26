// var assToken= '';
class Axios {
  constructor() {
    this.HOST = "http://106.14.212.56/api";
  }
  async login() {
    let that = this;
    let res = await this.post("http://106.14.212.56/api/user/login", {
      userName: "cyc",
      userPassword: "Asd12345!",
    });
    console.log(res && res.statusCode == 200 && res.data.code == "200", res);
    if (res && res.statusCode == 200 && res.data.code == "200") {
      return res.data.data.assToken;
    }
    return "";
  }

  post(
    url,
    data,
    assToken = "",
    contentType = { "Content-Type": "application/json" }
  ) {
    let that = this;
    return new Promise((call) => {
      uni.request({
        url: url,
        data: data,
        method: "POST",
        header: {
          ...contentType,
          assToken: assToken,
        },
        success: async (res) => {
          if (res.data.code == "200") {
            return call(res);
          }
        },
      });
    });
  }
}

class AliOss {
  constructor(assToken = "") {
    this.HOST = "http://106.14.212.56/api";
    this.$axios = new Axios();
    console.log(assToken, "assToken");
    this.assToken = assToken;
    // this.login()
  }

  async initSign() {
    let res = await this.$axios.post(
      this.HOST + "/add/getSignOss",
      { dir: "/cyc-save" },
      this.assToken
    );
    if (res.data.code == 200) {
      return res.data.data;
    }
  }
  async uploadFile(sign, file, imageSrc) {
    // let imageSrc = sign.dir
    console.log(
      imageSrc,
      file,
      sign,
      +"/" + file.name,
      file.fullPath.replace(/\/storage\/emulated\/0/, "")
    );
    uni.uploadFile({
      url: sign.host,
      // files:[{uri:file.fullPath.replace(/\/storage\/emulated\/0/,''),name: file.name}],
      header: { "content-type": "multipart/form-data" },
      filePath: file.fullPath.replace(/\/storage\/emulated\/0/, ""),
      formData: {
        key: sign.dir + "/" + file.name,
        policy: sign.policy,
        OSSAccessKeyId: sign.accessId,
        success_action_status: "200",
        //让服务端返回200,不然，默认会返回204
        signature: sign.signature,
      },
      success: (res) => {
        console.log(
          "uploadImage success, res is:",
          JSON.stringify(res),
          sign.host + file.name
        );
        uni.showToast({
          title: "上传成功",
          icon: "success",
          duration: 1000,
        });
        // this.$emit('imgUploaded', {data: sign.host + fileName, authId: this.authId});
      },
      fail: (err) => {
        console.log("uploadImage fail", err);
      },
    });
    //   console.log(signsObj,file)
    //   let request = new FormData()
    //         request.append('OSSAccessKeyId', signsObj.accessid) //Bucket 拥有者的Access Key Id。
    //         request.append('policy', signsObj.policy) //policy规定了请求的表单域的合法性
    //         request.append('Signature', signsObj.signature) //根据Access Key Secret和policy计算的签名信息，OSS验证该签名信息从而验证该Post请求的合法性
    //         //---以上都是阿里的认证策略
    //         let names = file.name.split('.')[file.name.split('.').length - 1]
    //         names = Date.parse(new Date()) + '' + Math.random() + '.' + names
    //         request.append('key', `${signsObj.dir}/${names}`) //文件名字，可设置路径
    //         request.append('success_action_status', '200') // 让服务端返回200,不然，默认会返回204
    //         request.append('file', file) //需要上传的文件 file
    // 		console.log('ooooooooooooooooooooooooo')
    // let res = await this.$axios.post(signsObj.host,request,this.assToken,{ 'Content-Type': 'multipart/form-data' })
    // console.log(res)
    // if(res){
    // 	console.log(res)
    // }
  }
}
export { AliOss, Axios };
