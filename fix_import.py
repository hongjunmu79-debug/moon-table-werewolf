path = r"C:\Users\23715\.gemini\antigravity\scratch\moon-table-werewolf\lib\game.ts"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = "import {configDeck,legacyConfig,resolveConfig,selfSaveAllowed,type GameConfig} from './rules';"
replacement = "import {configDeck,legacyConfig,resolveConfig,recommendedConfig,selfSaveAllowed,type GameConfig} from './rules';"

if target in text:
    text = text.replace(target, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Added recommendedConfig import successfully!")
else:
    print("Target not found!")
