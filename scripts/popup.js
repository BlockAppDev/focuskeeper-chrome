let msToTime = duration => {
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  if (hours > 0) 
    return hours + "h " + minutes + "m"
  else
    return minutes + "m"
}

console.log('executing popup.js')
let { tabs, sessions } = chrome.extension.getBackgroundPage()

let getHost = url => {
  let parser = document.createElement('a')
  parser.href = url
  return parser.host.replace('www.', '')
}

let getDuration = host => {
  console.log('getting duration for', host)
  console.log(sessions)
  let sum = 0
  sessions[host].forEach(s => {
    console.log(s.duration)
    if (s.hasOwnProperty('duration')) {
      sum += s.duration
    } else {
      console.log(sum)
      sum += (new Date() - s.start) // current session
    }
  })
  return msToTime(sum)
}

let createItem = (tab) => {
  let {favIconUrl, url} = tab 
  let duration = getDuration(getHost(url))

  $('#active-items').append(`
    <div class="item">
      <img class="favicon" src="${favIconUrl}" />
      <div class="hostname">${getHost(url)}</div>
      <div class="duration">${duration}</div>
    </div>`)
}

/* HANDLE ACTIVE TABS */
let activeTabs = document.getElementById('active-items')
Object.values(tabs).forEach(tab => {
  console.log(tab.title)
  createItem(tab)
})

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