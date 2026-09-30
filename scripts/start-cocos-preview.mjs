import { access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDirectory, '..')
const battleProject = resolve(appRoot, '..', 'optcg-card-battle')
const creatorPath = process.env.COCOS_CREATOR_PATH

if (!creatorPath) {
  throw new Error(
  '請設定 COCOS_CREATOR_PATH 為 Cocos Creator 執行檔完整路徑，再執行 npm run dev。',
  )
}

try {
  await access(creatorPath)
} catch {
  throw new Error(`找不到 Cocos Creator 執行檔：${creatorPath}`)
}

console.log(`啟動 Cocos Creator 專案：${battleProject}`)
console.log('請在 Cocos Creator 按下「預覽」啟動 Preview Server；前端會透過 /battle-game 代理至 http://127.0.0.1:7456。')

const creator = spawn(creatorPath, ['--project', battleProject], {
  stdio: 'inherit',
  windowsHide: false,
})

creator.on('error', (error) => {
  console.error('無法啟動 Cocos Creator：', error)
  process.exitCode = 1
})

creator.on('exit', (code) => {
  process.exitCode = code ?? 0
})
