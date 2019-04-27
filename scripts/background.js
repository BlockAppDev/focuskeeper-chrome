var sessions = {}
var tabs = {}
var currentTabId = -1

const getHost = url => {
  let parser = document.createElement('a')
  parser.href = url
  return parser.host.replace('www.', '')
}

const startSession = (host) => {
  console.log('start', host)
  if (!(host in sessions)) {
    sessions[host] = []
  }
  sessions[host].push({ 
    host, 
    start: new Date()
  })
}

const endSession = (host) => {
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
}

// on tab create/update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status && changeInfo.status === 'complete') {
    if (currentTabId in tabs) {
      let from = getHost(tabs[currentTabId].url)
      let to = getHost(tab.url)
      if (from !== to) {
        endSession(from)
        startSession(to)
        //console.log('switching from', from, 'to', to)
      }
    } else {
      startSession(getHost(tab.url))
      //console.log('opened', getHost(tab.url))
    }
    tabs[tab.id] = tab
    currentTabId = tab.id
  }
  //console.log(sessions)
})

chrome.tabs.onReplaced.addListener((addedTab, removedTab) => {
  console.log(addedTab, removedTab)
})

chrome.tabs.onActivated.addListener(activeInfo => {
  let tabId = activeInfo.tabId
  
  if (tabId === currentTabId)
    return

  if (tabId in tabs) {
    if (currentTabId in tabs) {
      let from = getHost(tabs[currentTabId].url)
      let to = getHost(tabs[tabId].url)
      endSession(from)
      startSession(to)
      //console.log('switched from', tabs[currentTabId].title, 'to', tabs[tabId].title)
    } else {
      //console.log('opened', tabs[activeInfo.tabId].title)
      startSession(getHost(tabs[tabId].url))
    }
    currentTabId = tabId
  }
  //console.log(sessions)
})


// on tab close
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId in tabs) {
    //console.log('closed', tabs[tabId].url)
    let host = getHost(tabs[tabId].url)
    let otherTabwithHost = false
    delete tabs[tabId]
    
    // check if other tabs with same host exists
    Object.values(tabs).forEach(tab => {
      if (getHost(tab.url) === host) {
        otherTabwithHost = true
      }
    })
    if (!otherTabwithHost) {
      endSession(host)
    }
    
  }
  //console.log(sessions)
})
