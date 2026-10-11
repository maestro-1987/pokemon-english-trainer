# 宝可梦英语训练家

一个用于家庭英语练习的静态网页游戏。打开发布后的网址即可玩，无须注册或登录。当前词库包括一年级上册、一年级下册和二年级上册，共 307 个去重词条。

游戏网址：[maestro-1987.github.io/pokemon-english-trainer](https://maestro-1987.github.io/pokemon-english-trainer/) · 源码仓库：[maestro-1987/pokemon-english-trainer](https://github.com/maestro-1987/pokemon-english-trainer)

单人可以玩听写探险、字母能量站和单词孵蛋器；两个人可以在**同一台设备**上玩双人道馆、合作孵蛋和招式接力。双人玩法使用左右答题区或轮流作答，适合触屏操作。

## 进度保存

练习记录、错题、伙伴和未完成轮次保存在当前设备、当前浏览器的网站数据中。没有账号或跨设备自动同步。清理网站数据、使用无痕模式或更换网址后，原来的进度可能无法继续使用。

可以在「学习记录」中导出进度 JSON，再在另一台设备导入。导入会替换该设备当前的进度；从原站点迁移到 GitHub Pages 时也请先导出，再在新网址导入。导入后从新轮次继续，已保存的练习记录和伙伴成长保留，未完成的原轮次不会接着进行。

## 发布与更新

仓库的 `dist/` 已经是可发布的完整网站，不需要安装依赖或在线构建。将仓库 Settings → Pages 的 Source 设为 **GitHub Actions**，即可由 `.github/workflows/pages.yml` 发布。

更新 `dist/` 后提交并推送到 `main`，GitHub Actions 会自动发布。也可在 Actions 中手动运行 Deploy GitHub Pages。公开仓库和网址可被任何持有链接的人访问。

本地原始工作区使用 `node game/scripts/build-github-pages.mjs` 重新生成这个仓库的 `dist/`。该脚本根据当前运行依赖白名单复制资源，同时检查相对路径、依赖完整性、WAV 格式和非静音数据。检查结果及每个文件的 SHA-256 保存在 `PUBLISH-AUDIT.json`。

运行时的脚本、图片和英文读音都随网站提供，没有第三方内容加载依赖。背景音乐及效果音由浏览器 Web Audio 合成。浏览器首次启动发音需要触摸进入玩法；播放失败时可点「重听」。

## 素材与来源

- 英语词条根据用户提供的教材和 Word List 整理，单词的文件名、页码、单元等出处保存在 `dist/data/words.json` 的 `source` / `sources` 中。仓库不包含原始 PDF、整页扫描、课程全文、OCR 草稿或旧词库历史基线。词义图片为教材中的局部裁图；部分颜色、数量和物品图为项目制作的 SVG。
- 25 张伙伴及进化形态图片来自 [Pokémon 官方图鉴](https://www.pokemon.com/us/pokedex)，包括伊布的八种进化形态。伊布达到 24 点成长时随机进化一次，揭晓结果保存在各自训练家的进度中；此前进化图鉴显示「❓」。角色及相关标识 © Pokémon / Nintendo / Creatures / GAME FREAK。
- 307 段英语 WAV 是在本地使用 [Piper](https://github.com/OHF-Voice/piper1-gpl) 与 [en_GB-alba-medium 模型](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alba/medium) 生成的合成读音，非教材原声。模型来源为爱丁堡大学 [Alba speech corpus](https://datashare.ed.ac.uk/handle/10283/3270)，模型卡标注 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。Piper、语音模型和生成程序不随网站分发。
- 首页和游戏场景、音乐、招式效果由项目的 CSS / SVG / Web Audio 实现。

这是家庭学习作品，非 Pokémon、教材出版社或相关版权方的官方产品；不宣称获得教材或角色素材的版权授权。本仓库对素材的整理和注明来源不改变原素材的权利归属。
