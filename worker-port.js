// 确保环境变量只声明一次
const API_URL = API_URL_ENV; // 从环境变量中获取 API URL
const VLESS_NODES = JSON.parse(VLESS_NODES_ENV); // 从环境变量中获取 VLESS 节点 JSON 数组
const AUTH_TOKEN = AUTH_TOKEN_ENV; // 从环境变量中获取授权令牌
const CUSTOM_PORT = CUSTOM_PORT_ENV || 'default_port_value'; // 从环境变量中获取自定义端口，如果未定义则使用默认值

// 获取优选 IP 列表，不再使用端口
async function fetchPreferredIPs() {
    const response = await fetch(API_URL);
    const text = await response.text();
    // 假设每行格式为 "IP" 或 "IP # comment"
    return text.split('\n').map(line => {
        const cleanLine = line.split('#')[0].trim();
        return cleanLine.length > 0 ? cleanLine : null;
    }).filter(ip => ip);
}

// 替换 VLESS 节点中的 address 和使用自定义端口
function replaceVLESSNode(vlessNode, ip) {
    const parts = vlessNode.split('@');
    if (parts.length < 2) return vlessNode;

    const addressPart = parts[1].split('?')[0];
    const oldAddressPort = addressPart.split(':');
    if (oldAddressPort.length < 2) return vlessNode;

    const newAddressPort = `${ip}:${CUSTOM_PORT}`;
    const newAddressPart = addressPart.replace(`${oldAddressPort[0]}:${oldAddressPort[1]}`, newAddressPort);
    const newRest = parts[1].replace(addressPart, newAddressPart);

    return `${parts[0]}@${newRest}`;
}

// 构建纯文本内容，只显示替换结果
function buildTextResponse(updatedNodes) {
    let textResponse = '';
    
    updatedNodes.forEach(node => {
        textResponse += `${node.updated}\n\n`;
    });

    return textResponse.trim();
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 从 URL 路径中提取 token
    const token = path.split('/')[1]; // 提取 "your-token"

    if (token !== AUTH_TOKEN) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 获取优选 IP 列表
        const preferredIPs = await fetchPreferredIPs();
        if (preferredIPs.length === 0) {
            return new Response('No IPs available', { status: 500 });
        }

        // 对每个 VLESS 节点使用所有 IP 进行替换，使用自定义端口
        let updatedNodes = [];
        preferredIPs.forEach(ip => {
            VLESS_NODES.forEach(node => {
                updatedNodes.push({
                    updated: replaceVLESSNode(node, ip)
                });
            });
        });

        // 生成纯文本内容并返回
        const textResponse = buildTextResponse(updatedNodes);
        return new Response(textResponse, {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}