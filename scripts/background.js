let active = {}
let prevHost = null;

const endSession = host => {
  console.log('ending ' + host)
  if (!host) 
    return
  
  let s = active[host][active[host].length - 1] // last session
  if (s.end) 
    return
  s.end = new Date()
  s.duration = s.end - s.start
}

const addSession = host => {
  console.log('adding ' + host)
  active[host].push({
    start: new Date(),
    end: null,
    duration: null
  })
}

const getHostname = url => {
  let parser = document.createElement('a')
  parser.href = url
  return parser.host
}

// on tab create/update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log('tabId', tabId)
  // console.log('changeInfo', changeInfo)
  // console.log('tab', tab)
  console.log('*')
  if (changeInfo.url) {
    let hostname = getHostname(changeInfo.url)
    if (hostname in active) {
      endSession(prevHost)
      addSession(hostname)
    } else {
      if (prevHost in active) {
        endSession(prevHost)
      }
      active[hostname] = [{
        start: new Date,
        end: null,
        duration: null
      }]
    }
    prevHost = hostname
    console.log(active)
  }
})

chrome.tabs.onReplaced.addListener((addedTab, removedTab) => {
  console.log('ADDED TAB', addedTab)
  // console.log('changeInfo', changeInfo)
  console.log('replaced')
})

chrome.tabs.onActivated.addListener(activeInfo => {
  console.log(activeInfo)
  endSession(prevHost)
  chrome.tabs.query({ active: true }, tabs => {
    console.log(tabs)
  })
  console.log(active)
})

chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === 'focuskeeper')
  port.onMessage.addListener(msg => {
    console.log(msg)
    if (msg.req === 'popup') {
      let total = 0
      let hostTotal = 0
      for (let hostname in active) {
        active[hostname].forEach(s => {
          if (s.duration) {
            total += s.duration;
            if (hostname === prevHost) 
              hostTotal += s.duration
          }
        })
      }
      port.postMessage({ total, host: prevHost, hostTotal })
    }
  })
})

// on tab close
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('removed')
  // console.log('tabId', tabId)
  // console.log('removeInfo', removeInfo)
})