环境变量
①
AUTH_TOKEN_ENV   //入口验证

  使用：域名/token
②
VLESS_NODES_ENV //节点信心链接txt json

   格式:
       [
        "vless://",
        "trojan://",
        "vmess://"
        ]
        
 ③       
API_URL_ENV //优选ip链接 支持CMLIU的优选IP入https://addressesapi.090227.xyz/ct

  txt格式:
  
     ip:prot#注释
workers链接可以直接作为订阅链接
④
CUSTOM_PORT_ENV
自定义端口
