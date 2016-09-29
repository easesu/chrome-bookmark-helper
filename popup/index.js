function getClassName(element) {
    return new Set(element.className.split(/\s+/g))
}

function addClass(element) {
    if (element) {
        let classNames = getClassName(element);
        Array.prototype.slice.call(arguments, 1).forEach(newClasses => {
            String(newClasses).split(/\s+/g).forEach(newClass => {
                if (classNames.has(newClass) === false) {
                    classNames.add(newClass)
                }
            })
        })
        
        element.className = [...classNames].join(' ')
    }
}

function removeClass(element) {
    if (element) {
        let classNames = getClassName(element);
        Array.prototype.slice.call(arguments, 1).forEach(newClasses => {
            String(newClasses).split(/\s+/g).forEach(newClass => {
                if (classNames.has(newClass) === true) {
                    classNames.delete(newClass)
                }
            })
        })
        
        element.className = [...classNames].join(' ')
    }
}

function getUrlFirstLetter(url = '') {
    return (url.replace(/^http(s)?\:\/\/(www\.)?/, '')[0]).toUpperCase()
}


class EventEmitter {
    constructor() {
        this.listeners = {}
        this.globalListeners = [];
    }
    
    isExist(eventType, target) {
        let listeners;
        if (typeof eventType === 'function') {
            target = eventType;
            eventType = 'all'
        }
        if (eventType === 'all') {
            listeners = this.globalListeners
        } else {
            listeners = this.listeners[eventType]
        }
        
        return listeners ? listeners.some(listener => listener === target) : false
    }
    
    on(eventTypes, listener) {
        if(typeof eventTypes === 'function') {
            listener = eventTypes;
            eventTypes = 'all'
        }
        
        if (eventTypes === 'all') {
            if (!this.isExist(listener)) {
                this.globalListeners.push(listener)
            }
        } else {
            eventTypes.split(/\s+/g).forEach(eventType => {
                if (!this.isExist(eventType, listener)) {
                    if (!this.listeners[eventType]) {
                        this.listeners[eventType] = []
                    }
                    this.listeners[eventType].push(listener)
                }
            })
        }
    }
    
    off(eventTypes, listener) {
        if(typeof eventTypes === 'function') {
            listener = eventTypes;
            eventTypes = 'all'
        }
        
        if (eventTypes === 'all') {
            if (this.isExist(listener)) {
                this.globalListeners.splice(this.globalListeners.indexOf(listener), 1);
            }
        } else {
            eventTypes.split(/\s+/g).forEach(eventType => {
                if (this.isExist(eventType, listener)) {
                    this.listeners[eventType].splice(this.listeners[eventType].indexOf(listener), 1)
                }
            })
        }
    }
    
    emit(eventTypes) {
        let args = Array.prototype.slice.call(arguments, 0).slice(1);
        eventTypes.split(/\s+/g).forEach(eventType => {
            if (eventType !== 'all') {
                (this.listeners[eventType] || []).forEach(listener => {
                    listener.apply(this, args)
                })
            }
        })
        
        this.globalListeners.forEach(listener => {
            listener.apply(this, args)
        })
    }
}

class Bookmark extends EventEmitter {
    constructor(data) {
        super();
        this.element = null;
        this.data = data;
    }
    
    render() {
        if (this.element === null) {
            this.element = Bookmark.createElement(this.data);
        }
        
        return this.element
    }
    
    match(query = '') {
        query = String(query).toLowerCase();
        return !query ? true : ['title', 'url'].some(property => {
            let value = this.data[property];
            if (property === 'url') {
                value = value.replace(/^http(s)?\:\/\/(www\.)?/, '')
            }
            return !!~value.indexOf(query)
        })
    }
    
    select() {
        this.selected = true;
        addClass(this.element, 'selected')
    }
    
    unselect() {
        this.selected = false;
        removeClass(this.element, 'selected')
    }
    
    isSelected() {
        return this.selected
    }
    
    get url() {
        return this.data.url
    }
    
    destroy() {
        
    }
}

Bookmark.createElement = function(data) {
    let element = document.createElement('div');
    let firstLetter = getUrlFirstLetter(data.url);
    element.className = 'bookmark';
    element.innerHTML = `
        <a href="${data.url}" target="_blank"><i>${firstLetter}</i>${data.title}</a>
    `;
    
    return element
}

class BookmarkList extends EventEmitter {
    constructor(data) {
        super();
        this.children = data.map(bookmark => new Bookmark(bookmark));
        this.filterList = null;
        this.element = null;
    }
    
    render() {
        this.element = document.createElement('div');
        this.element.className = 'list';
        return this.element;
    }
    
    match(query) {
        if (this.selectBookmark) {
            this.selectBookmark.unselect()
        }
        
        let fragment = document.createDocumentFragment();
        this.filterList = this.children.filter(bookmark => bookmark.match(query));
        this.filterList.forEach(bookmark => {
            fragment.appendChild(bookmark.render())
        });
        
        this.element.innerHTML = '';
        this.element.appendChild(fragment);
        
        this.selectByIndex(0)
    }
    
    select(bookmark) {
        if (bookmark) {
            if (this.selectBookmark) {
                this.selectBookmark.unselect()
            }
            bookmark.select();
            this.selectBookmark = bookmark
        }
    }
    
    selectByIndex(index = 0) {
        if (this.filterList) {
            this.select(this.filterList[index])
        }
    }
    
    selectPrev() {
        if (this.filterList) {
            let index = 0;
            this.filterList.some((bookmark, i) => {
                if (bookmark.isSelected()) {
                    index = i;
                    return true
                }
            })
            this.select(this.filterList[index - 1])
        }
    }
    
    selectNext() {
        if (this.filterList) {
            let index = 0;
            this.filterList.some((bookmark, i) => {
                if (bookmark.isSelected()) {
                    index = i;
                    return true
                }
            })
            this.select(this.filterList[index + 1])
        }
    }
    
    get selectedUrl() {
        return this.selectBookmark ? this.selectBookmark.url : '';
    }

}

class Search extends EventEmitter {
    constructor() {
        super();
    }
    
    render() {
        this.element = document.createElement('div');
        
        this.element.className = 'search';
        this.element.innerHTML = `
            <div>
                <input type="text" />
            </div>
        `;
        
        this.bind();
        
        return this.element;
    }
    
    bind() {
        let self = this;
        let input = this.element.querySelector('input');
        let keymap = {
            38: 'up',
            39: 'right',
            40: 'down',
            41: 'left',
            13: 'ok'
        }
        
        input.addEventListener('input', function(e) {
            self.emit('search', this.value);
        }, false);
        
        input.addEventListener('keyup', function(e) {
            let keyFn = keymap[e.keyCode];
            if (keyFn) {
                self.emit('shortcut', keyFn)
            }
        }, false);
    }
    
    focus() {
        this.element.querySelector('input').focus()
    }
}

class Panel extends EventEmitter {
    constructor(bookmarks) {
        super(bookmarks);
        this.element = document.getElementById('wrap');
        this.search = new Search;
        this.list = new BookmarkList(bookmarks);
    }
    
    render() {
        this.element.appendChild(this.search.render());
        this.element.appendChild(this.list.render())
        this.bind();
        this.search.focus();
        this.list.match();
    }
    
    bind() {
        
        document.querySelector('body').addEventListener('keydown', function() {
            this.search.focus()
        }.bind(this), false)
        
        this.search.on('search', this.list.match.bind(this.list));
        
        this.search.on('shortcut', function(fn) {
            switch(fn) {
                case 'up':
                case 'left':
                    this.list.selectPrev();
                    break;
                case 'down':
                case 'right':
                    this.list.selectNext();
                    break;
                case 'ok':
                    chrome.tabs.create({
                        url: this.list.selectedUrl
                    })
                    break;
            }
        }.bind(this))
    }
}


chrome.runtime.sendMessage({
  type: 'GET_ALL_BOOKMARKS'
}, function(data) {
  (new Panel(data.sort((a, b) => {
      return getUrlFirstLetter(a.url) < getUrlFirstLetter(b.url) ? -1 : 1
  }))).render()
})