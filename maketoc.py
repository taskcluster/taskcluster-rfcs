import os
import re

LINE_RE = re.compile(r'^# RFC 0*([0-9]+) *-? *(.*)$')

def main():
    rfcs = {}
    with os.scandir('rfcs') as it:
        for dentry in it:
            if dentry.name.endswith('.md') and dentry.is_file() and dentry.name != 'README.md':
                with open(dentry.path, "r") as f:
                    line = f.readlines()[0]
                    mo = LINE_RE.match(line)
                    try:
                        rfcs[int(mo.group(1))] = (dentry.name, mo.group(2))
                    except:
                        print(line)
                        raise

    update(rfcs, "README.md", "rfcs/")
    update(rfcs, "rfcs/README.md", "")

def update(rfcs, filename, prefix):
    table = [['RFC', 'Title']] + [
        ['RFC#%d' % num, '[%s](%s%s)' % (title, prefix, file)]
        for num, (file, title) in sorted(rfcs.items())
    ]
    lens = [0, 0]
    for row in table:
        for i, v in enumerate(row):
            l = len(v)
            if l > lens[i]:
                lens[i] = l

    tpl = "| %-{}s | %-{}s |".format(*lens)

    rv = [tpl % tuple(row) for row in table]
    rv.insert(1, tpl % tuple(('-' * l for l in lens)))
    table = "\n".join(rv)

    with open(filename, "r") as f:
        content = f.read()
        content = re.sub(
            '<!-- GENERATED -->.*',
            '<!-- GENERATED -->\n' + table + '\n',
            content,
            flags=re.S)
    with open(filename, "w") as f:
        f.write(content)

main()
