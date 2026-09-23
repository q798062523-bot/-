/* 指数信号台 Service Worker —— 页面壳网络优先 + 离线兜底，数据接口一律直连不缓存 */
var CACHE = 'signal-desk-v4';
var CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = e.request.url;
  /* 行情 / 快讯 / 检索 / 字体 / banner 图片等外部资源：直连网络，不缓存（保证数据实时） */
  if(/push2\.|push2his\.|qt\.gtimg|ifzq\.gtimg|newsapi\.eastmoney|searchapi\.eastmoney|miaoda\.feishu|aka\.doubaocdn/.test(url)) return;
  /* 页面静态文件：网络优先，失败时回退缓存（避免用户看到旧版本） */
  e.respondWith(
    fetch(e.request).then(function(res){
      var cp = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, cp); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});
