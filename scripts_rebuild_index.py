import io

FILES = [
    "js/core/constants.js",
    "js/core/utils.js",
    "js/core/examSource.js",
    "js/core/logMetrics.js",
    "js/core/db.js",
    "js/math/primitives.js",
    "js/math/expr.js",
    "js/math/explain.js",
    "js/math/graphPreview.js",
    "js/math/graphSvg.js",
    "js/generators/shared.js",
    "js/generators/elementary.js",
    "js/generators/middle.js",
    "js/generators/high/explore.js",
    "js/generators/high/polynomial.js",
    "js/generators/high/equation.js",
    "js/generators/high/geometry.js",
    "js/generators/high/setFunction.js",
    "js/generators/high/probStat.js",
    "js/worksheet/gedCore.js",
    "js/worksheet/gedUnits.js",
    "js/ui/auth.js",
    "js/ui/splash.js",
    "js/ui/sessionPrint.js",
    "js/student/exploreModules.js",
    "js/student/explore.js",
    "js/student/home.js",
    "js/student/practice.js",
    "js/student/coordDaily.js",
    "js/student/report.js",
    "js/student/history.js",
    "js/student/mockExam.js",
    "js/student/homework.js",
    "js/student/dashboard.js",
    "js/teacher/analysisEngine.js",
    "js/teacher/wrongNote.js",
    "js/teacher/wrongNotePanel.js",
    "js/teacher/notice.js",
    "js/teacher/analysisTab.js",
    "js/teacher/studentDetail.js",
    "js/teacher/worksheet.js",
    "js/teacher/gedWorksheet.js",
    "js/teacher/dashboard.js",
    "js/app.js",
]

with io.open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# HEAD: everything through the blank line right after <script type="text/babel">
# (줄 번호를 고정하지 않고 마커를 찾는다 — head의 CSS/링크가 늘어나도 안전)
marker = next(i for i, l in enumerate(lines) if l.strip() == '<script type="text/babel">')
head = lines[:marker + 2]
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
