'use strict';

/**
* @const
*/
const UrlPartNames = [
  'protocol',
  'host',
  'hostname',
  'port',
  'pathname',
  'search',
  'hash',
  'username',
  'password',
  'origin',
  'searchParams'
]

/**
* 获取全部书签
*/
function getChildren(item) {
  if (item.children) {
    return item.children.reduce(function(list, nextItem) {
      return list.concat(getChildren(nextItem));
    }, [])
  } else {
    return [Object.assign({
      urlComponent: parseUrl(item.url),
      timeComponetn: parseTime(item.dateAdded)
    }, item)];
  }
}


/**
* 获取链接信息
* @param {String} url
* @return {Object}
*/
function parseUrl(url) {
  var urlInstance = new URL(url),
      urlObject = {};
  
  UrlPartNames.forEach(function(part) {
    urlObject[part] = this[part];
  }.bind(urlInstance));
  
  return urlObject
}

function parseTime(milliSeconds) {
  var time = new Date(milliSeconds);
  return {
    year: time.getFullYear(),
    month: time.getMonth(),
    date: time.getDate(),
    day: time.getDay(),
    hour: time.getHours(),
    minute: time.getMinutes(),
    second: time.getSeconds(),
    milliSeconds: time.getMilliseconds()
  }
}

function getAllBookmarks() {
  return new Promise(function(resolve, reject) {
    chrome.bookmarks.getTree(function(data) {
      resolve(getChildren(data[0]));
    });
  })
}


chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  switch(request.type) {
    case 'GET_ALL_BOOKMARKS':
      getAllBookmarks()
        .then(callback)
    
  }
  return true;
})