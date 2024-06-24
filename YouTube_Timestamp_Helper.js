// ==UserScript==
// @name         YouTube Timestamp Helper
// @version      0.1
// @match        https://*.youtube.com/*
// @icon         https://youtube.com/favicon.ico
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// configurable vars
const webhookURL = '' // e.g 'https://discord.com/api/webhooks/...'
const secondsAdjust = -5 // adjust timestamp (by seconds) to account for reaction time
const askForDescription = true // show prompt for description

const s = ".ytp-time-current"

GM_addStyle (`
.ytp-time-display:has(.ytp-time-current) {
  display: flex;
}
.ytp-time-display.ytp-live > span:has(.ytp-time-current) {
  order: 3;
}
.ytp-time-display.ytp-live .ytp-time-current {
  display: unset;
  margin-left: 13px;
}
.ytp-time-display .ytp-time-current {
  cursor: pointer;
}
`)

const sendWebhook = message => {
  fetch(webhookURL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
}

const descriptionPrompt = defaultText => {
  if (!askForDescription) return defaultText
  const answer = prompt('Enter timestamp description:')
  return answer.length ? answer : defaultText
}

const makeEmbed = ({ username, timestamp, title, thumbnail, url, v: videoId }) => ({
  title: descriptionPrompt(videoId),
  description: `[${title} [${username}] (${videoId})](${url})`,
  color: parseInt('0xeb4545', 16),
  author: {
    name: timestamp,
    url
  },
  timestamp: new Date().toISOString(),
  thumbnail,
})

const toSeconds = hhmmss => {
  const parts = hhmmss.split(':')
  if (parts.length < 3) parts.unshift('00')
  return (+parts[0]) * 60 * 60 + (+parts[1]) * 60 + (+parts[2]);
}

const onTimestampClick = ({ target: { innerText: currentTime } }) => {
  const { author: username, videoId, title, thumbnail: { thumbnails } } = ytInitialPlayerResponse.videoDetails;
  const thumbnail = thumbnails[thumbnails.length-1]
  const seconds = toSeconds(currentTime) + secondsAdjust
  const timestamp = new Date(seconds * 1000).toISOString().slice(11, 19)
  const url = `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`
  const avatar_url = document.querySelector('#owner img').src
  const embed = makeEmbed({ username, timestamp, title, thumbnail, url, videoId })
  const message = {
    content: "",
    username,
    avatar_url,
    embeds: [ embed ]
  }
  sendWebhook(message)
}

const navHandler = () => {
  if (location.pathname === '/watch') {
    document.querySelectorAll(s).forEach((node => {
      node.addEventListener('click', onTimestampClick)
    }))
  }
}

window.addEventListener("yt-navigate-finish", navHandler, true)