path = r"C:\Users\23715\.gemini\antigravity\scratch\moon-table-werewolf\lib\game.ts"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = "return r.gameType==='avalon'?recommendedConfig(validSize)\nfunction voters"
replacement = "return r.gameType==='avalon'?recommendedConfig(validSize):legacyConfig(r.size);\n}\nfunction voters"

if target in text:
    text = text.replace(target, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed line 26 successfully!")
else:
    print("Target not found!")
