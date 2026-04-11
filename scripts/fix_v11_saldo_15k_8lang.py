"""V11 fix: saldoavs § 14-40(1) 15 000 → 30 000 i 8 gjenstående lang-filer.

Bevarer 3. forekomst (§ 14-44(2-3) "Balance under 15 000 kr" — annen terskel).
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")


def extract_array_bounds(content, key):
    idx = content.find(f"{key}:")
    if idx < 0:
        return None
    open_idx = content.find("[", idx)
    depth = 1
    i = open_idx + 1
    while i < len(content) and depth > 0:
        c = content[i]
        if c == "'":
            i += 1
            while i < len(content):
                if content[i] == "\\" and i + 1 < len(content):
                    i += 2
                    continue
                if content[i] == "'":
                    i += 1
                    break
                i += 1
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return (open_idx, i + 1)
        i += 1
    return None


fixes = [
    ("ar.js", "15 000", "30 000"),
    ("fr.js", "15 000", "30 000"),
    ("lt.js", "15 000", "30 000"),
    ("pl.js", "15 000", "30 000"),
    ("so.js", "15 000", "30 000"),
    ("ti.js", "15 000", "30 000"),
    ("uk.js", "15 000", "30 000"),
    ("zh.js", "15,000", "30,000"),
]
for fname, old_val, new_val in fixes:
    path = f"shared/lang/{fname}"
    with open(path, encoding="utf-8") as f:
        content = f.read()
    bounds = extract_array_bounds(content, "salDeprRows")
    if not bounds:
        print(f"{fname}: no salDeprRows")
        continue
    start, end = bounds
    block = content[start:end]
    count = block.count(old_val)
    if count < 2:
        print(f"{fname}: only {count}× {old_val} (expected 3+)")
        continue
    # Replace only first 2 occurrences (3rd is § 14-44(2-3) negative saldo — keep)
    new_block = block.replace(old_val, new_val, 2)
    new_content = content[:start] + new_block + content[end:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    # Verify 3rd is still there
    remaining_in_block = new_block.count(old_val)
    print(f"{fname}: 2x {old_val}->{new_val} i salDeprRows (gjenstaer {remaining_in_block} i blokken for § 14-44)")
