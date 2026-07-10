import io

FILES = [
    "js/constants.js",
    "js/generators/basic.js",
    "js/generators/highschool.js",
    "js/generators/setFunc.js",
    "js/components/canvas.js",
    "js/components/auth.js",
    "js/components/home.js",
    "js/components/practice.js",
    "js/components/geometry.js",
    "js/components/mockExam.js",
    "js/components/worksheet.js",
    "js/components/feedback.js",
    "js/dashboards/studentDashboard.js",
    "js/dashboards/teacherDashboard.js",
    "js/app.js",
]

with io.open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# HEAD: everything through the blank line right after <script type="text/babel">
head = lines[:196]
assert head[-2].strip() == '<script type="text/babel">', head[-2]
assert head[-1].strip() == '', repr(head[-1])

body_parts = []
for rel in FILES:
    marker_path = rel.replace("/", "\\")
    with io.open(rel, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.endswith("\n"):
        content += "\n"
    body_parts.append(f"// ========== {marker_path} ==========\n{content}\n\n")

tail = "\n</script>\n\n</body>\n</html>\n"

with io.open("index.html", "w", encoding="utf-8", newline="\n") as f:
    f.writelines(head)
    f.write("".join(body_parts))
    f.write(tail)

print("rebuilt index.html")
