let msToTime = duration => {
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  return hours + "h " + minutes + "m";
}

let port = chrome.runtime.connect({name: 'focuskeeper'})
port.postMessage({ req: 'popup'})
port.onMessage.addListener(msg => {
  //port.postMessage({msg: 'thanks'})
  document.getElementById('total').textContent = `${msToTime(msg.total)}`
  document.getElementById('url').textContent = `${msg.host}`
  document.getElementById('url-total').textContent = `${msToTime(msg.hostTotal)} today`
})

