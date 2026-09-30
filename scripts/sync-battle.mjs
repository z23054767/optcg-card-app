import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')

const source = resolve(
  projectRoot,
  'node_modules/@z23054767/optcg-card-battle/build/web-desktop',
)

const destination = resolve(projectRoot, 'public/battle-game')

try {
  await stat(resolve(source, 'index.html'))
} catch {
  throw new Error(
    '找不到 Cocos Web Build，請先安裝 @z23054767/optcg-card-battle',
  )
}

await rm(destination, {
  recursive: true,
  force: true,
})

await mkdir(destination, {
  recursive: true,
})

await cp(source, destination, {
  recursive: true,
})

console.log('Cocos Battle 已同步到 public/battle-game')