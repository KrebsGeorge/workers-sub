// 确保环境变量只声明一次
const API_URL = API_URL_ENV; // 从环境变量中获取 API URL
const VLESS_NODES = JSON.parse(VLESS_NODES_ENV); // 从环境变量中获取 VLESS 节点 JSON 数组
const AUTH_TOKEN = AUTH_TOKEN_ENV; // 从环境变量中获取授权令牌

// 获取优选 IP 和端口列表
async function fetchPreferredIP() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch IPs');
    }
    const text = await response.text();
    const lines = text.split('\n').map(line => {
        const cleanLine = line.split('#')[0].trim();
        const parts = cleanLine.split(':');
        if (parts.length === 2) {
            return { ip: parts[0].trim(), port: parts[1].trim() };
        } else if (parts.length === 1) {
            return { ip: parts[0].trim(), port: null };
        }
        return null;
    }).filter(entry => entry && entry.ip);

    if (lines.length === 0) {
        throw new Error('No valid IPs found');
    }

    // 随机选择一个 IP 和（可能的）端口
    return lines[Math.floor(Math.random() * lines.length)];
}

// 替换 VLESS 节点中的 address 和 port
function replaceVLESSNode(vlessNode, ip, port) {
    const parts = vlessNode.split('@');
    if (parts.length < 2) return vlessNode;

    const addressPart = parts[1].split('?')[0];
    const oldAddressPort = addressPart.split(':');
    if (oldAddressPort.length < 2) return vlessNode;

    const newAddressPort = port ? `${ip}:${port}` : `${ip}:${oldAddressPort[1]}`;
    const newAddressPart = addressPart.replace(`${oldAddressPort[0]}:${oldAddressPort[1]}`, newAddressPort);
    const newRest = parts[1].replace(addressPart, newAddressPart);

    return `${parts[0]}@${newRest}`;
}

// 构建纯文本内容，只显示替换结果
function buildTextResponse(updatedNodes) {
    return updatedNodes.map(node => node.updated).join('\n\n').trim();
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
        // 获取优选 IP 和端口
        const { ip, port } = await fetchPreferredIP();

        // 对每个 VLESS 节点替换 IP 和端口
        const updatedNodes = VLESS_NODES.map(node => ({
            updated: replaceVLESSNode(node, ip, port)
        }));

        // 生成纯文本内容并返回
        const textResponse = buildTextResponse(updatedNodes);
        return new Response(textResponse, {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}
