import { App } from 'vue'

const POLL_INTERVAL = 12_000 // 12s
const RESTART_DELAY = 2_000 // 2s

declare var webParams: Record<string, any>
declare var vueApp: App | undefined

function reloadFsEntryPoint(params: Record<string, any> = {}) {
  if (!vueApp) {
    console.error('`window.vueApp` not found! Will reload the page')
  }

  const { mp } = Object.assign(webParams, params)
  const $el = document.getElementById((mp || 'vue-app') as string)
  if ($el?.firstElementChild) {
    vueApp?.unmount($el.firstElementChild)
    $el.removeAttribute('data-v-app')
  } else {
    console.warn(`Mount point '${mp}' not found!`)
  }

  const $ep = document.getElementById('web-entry')! as HTMLScriptElement
  console.log(`reloading ${$ep.src}`)
  return import(`${$ep.src}?t=${Date.now()}`)
}

function tryReconnect(cb: () => void) {
  setTimeout(() => {
    fetch('/check-dev-online', { method: 'HEAD' })
      .then(() => {
        cb()
        setTimeout(reloadFsEntryPoint, RESTART_DELAY)
      })
      .catch((_e) => {
        tryReconnect(cb)
      })
  }, POLL_INTERVAL)
}

declare global {
  interface Window {
    reloadFsEntryPoint: typeof reloadFsEntryPoint
    tryReconnect: typeof tryReconnect
  }
}

window.reloadFsEntryPoint = reloadFsEntryPoint
window.tryReconnect = tryReconnect
