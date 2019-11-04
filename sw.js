var cacheName = 'V1';

var filesToCache = [
    '/',                // index.html
    '/wiki/'
];

self.addEventListener('install', function(event) {
    console.log('Installed sw.js', event);
    event.waitUntil(
        caches.open(cacheName)
        .then(function(cache) {
            console.info('[sw.js] cached all files');
            return cache.addAll(filesToCache);
        })
    );
});



self.addEventListener('fetch', function(event){// Tell the fetch to respond with this chain
console.log(event);
   event.respondWith(
     // Open the cache
     caches.open(cacheName)
       .then((cache) => {
         // Look for matching request in the cache
         return cache.match(event.request)
           .then((matched) => {
             // If a match is found return the cached version first
             if (matched) {
               return matched;
             }
             // Otherwise continue to the network
             return fetch(event.request)
               .then((response) => {
                 // Cache the response
                 cache.put(event.request, response.clone());
                 // Return the original response to the page
                 return response;
               });
           });
       })
  );
});

self.addEventListener('activate', function(event) {
    console.log('Activated sw.js', event);
});
