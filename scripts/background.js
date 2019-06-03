var sessions = {}
var tabs = {}
var currentTabId = -1

const getHost = url => {
  let parser = document.createElement('a')
  parser.href = url
  return parser.host.replace('www.', '')
}

const startSession = (host, favIconUrl) => {
  console.log('start', host)
  if (!(host in sessions)) {
    sessions[host] = []
  }
  sessions[host].push({ 
    host, 
    favIconUrl,
    start: new Date()
  })
}

const endSession = (host, cb) => {
  console.log('end', host)
  if (!(host in sessions))
    return
  let length = sessions[host].length
  let obj = sessions[host][length - 1]

  if (obj.hasOwnProperty('end')) {
    return //ignore if ended (closing other tab)
  }
  obj.end = new Date()
  obj.duration = obj.end - obj.start
  if (cb !== undefined) {
    console.log('running callback')
    cb(host, obj.duration)
  }
}

const saveDuration = (host, duration) => {
  console.log('SAVING DATA', host, duration)
  fetch(`http://localhost:8000/data?url=${host}&seconds=${parseInt(duration/100, 10)}`, { method: 'PUT' })
  .then(res => {
    if (res.status === 200) {
      console.log('Saved data successfully')
    }
  }).catch(e => console.log('Error saving', e))
}

// on tab create/update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('enter onUpdated')

  let { status, url } = changeInfo 

  fetch(`http://localhost:8000/blocked?url=${getHost(url)}`)
    .then(res => res.json())
    .then(res => {
      if (status && status === 'loading' && res.blocked) {

        // send message to popup.js
        console.log('sending message')
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box"}, function(response) {});  
        });

        console.log('Going to block')
        chrome.tabs.update(tabId, { url: 'chrome://newtab' }, () => {
          console.log('Blocked', tab.url)
        })
      }
    })
    .catch(e => console.log(e))

  if (status && status === 'complete') {
    console.log('run onUpdated')
    if (currentTabId in tabs) {
      let from = getHost(tabs[currentTabId].url)
      let to = getHost(tab.url)
      if (from !== to) {
        endSession(from)
        startSession(to, tab.favIconUrl)
        console.log('switching from', from, 'to', to)
      }
    } else {
      startSession(getHost(tab.url), tab.favIconUrl)
      console.log('opened', getHost(tab.url))
    }
    tabs[tab.id] = tab
    currentTabId = tab.id
  }
})

chrome.tabs.onReplaced.addListener((addedTab, removedTab) => {
  console.log('run onReplaced')
  console.log(addedTab, removedTab)
})

chrome.tabs.onActivated.addListener(activeInfo => {
  let tabId = activeInfo.tabId
  
  if (tabId === currentTabId)
    return

  console.log('enter onActivated')
  if (tabId in tabs) {
    console.log('run onActivated')
    if (currentTabId in tabs) {
      let from = getHost(tabs[currentTabId].url)
      let to = getHost(tabs[tabId].url)
      endSession(from)
      startSession(to, tabs[currentTabId].favIconUrl)
      console.log('switched from', tabs[currentTabId].title, 'to', tabs[tabId].title)
    } else {
      console.log('opened', tabs[activeInfo.tabId].title)
      startSession(getHost(tabs[tabId].url), tabs[tabId].favIconUrl)
    }
    currentTabId = tabId
  }
})

// on tab close
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('enter onRemoved')
  if (tabId in tabs) {
    console.log('run onRemoved')
    console.log('closed', tabs[tabId].url)
    let host = getHost(tabs[tabId].url)
    let otherTabwithHost = false
    delete tabs[tabId]
    
    // check if other tabs with same host exists
    Object.values(tabs).forEach(tab => {
      if (getHost(tab.url) === host) {
        otherTabwithHost = true
      }
    })

    // no other tabs with same host
    console.log('session:', sessions)
    if (!otherTabwithHost) {
      endSession(host, saveDuration)
    }
  }
})