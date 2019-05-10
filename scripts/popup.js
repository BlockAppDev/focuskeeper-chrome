let msToTime = duration => {
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  if (hours > 0) 
    return hours + "h " + minutes + "m"
  else
    return minutes + "m"
}

console.log('executing popup.js')
let { tabs, sessions, blockList } = chrome.extension.getBackgroundPage()
console.log(tabs, sessions)

let getHost = url => {
  let parser = document.createElement('a')
  parser.href = url
  return parser.host.replace('www.', '')
}

let getDuration = host => {
  let sum = 0
  if (host in sessions) {
    sessions[host].forEach(s => {
      if (s.hasOwnProperty('duration')) {
        sum += s.duration
      } else {
        sum += (new Date() - s.start) // current session
      }
    })
    return msToTime(sum)
  } else {
    return ''
  }
}

let createItem = (favIconUrl, hostname, id) => {
  let duration = getDuration(hostname)
  $(id).append(`
    <div class="item">
      <img class="favicon" src="${favIconUrl}" />
      <div class="hostname">${hostname}</div>
      <div class="duration">${duration}</div>
    </div>`)
}

//TODO: Timeout session after inactivity
// const checkPageFocus = () => {
//   let body = document.querySelector('body')
//   if (document.hasFocus()) {
//     console.log('In focus')
//   } else {
//     console.log('Not in focus')
//   }
// }

// //setInterval(checkPageFocus, 1000)

/* HANDLE TOTAL DURATION */
let totalDuration = 0
Object.values(sessions).forEach(host => {
  host.forEach(s => {
    if (s.hasOwnProperty('duration')) {
      totalDuration += s.duration
    } else {
      totalDuration += (new Date() - s.start) // current session
    }
  })
})
$('#time-main').text(msToTime(totalDuration))

/* HANDLE BLOCKED ITEMS */
console.log(blockList)
Array.from(blockList).forEach(host => {
  console.log("host", host)
  createItem("https://www.siteinspire.com/favicon.png", host, '#blocked-items')
})

/* HANDLE ACTIVE TABS */
Object.values(tabs).forEach(tab => {
  createItem(tab.favIconUrl, getHost(tab.url) , '#active-items')
})

/* HANDLE HISTORY */
Object.values(sessions).forEach(hostSessions => {
  let hostname = hostSessions[0].host
  let duration = getDuration(hostname)
  let favIconUrl = hostSessions[0].favIconUrl
  createItem(favIconUrl, hostname, '#history-items')
})