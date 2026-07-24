// Cloudflare Pages SPA fallback：所有未匹配静态文件的请求返回 index.html
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 静态资源直接放行
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    // 命中实际文件也放行
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // 其余路径全部返回 index.html（SPA history 路由 fallback）
    const indexUrl = new URL('/', url.origin);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
