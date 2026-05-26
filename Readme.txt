CS105 GEOMETRY STUDIO - HUONG DAN CAI DAT VA SU DUNG

1. Gioi thieu
CS105 Geometry Studio la do an mo phong do hoa 3D tren web, duoc xay dung moi bang Three.js va Vite. Ung dung cho phep tao hinh hoc 3D, doi che do hien thi Solid / Points / Lines, dieu khien phep chieu phoi canh, bien doi affine, anh sang, bong do, texture, nap model tu file va chay animation.

2. Cau truc nop bai
- Source/: ma nguon TypeScript/Vite cua chuong trinh.
- Release/: ban build tinh chua file HTML va assets de chay khi cham bai.
- Doc/Report.tex: bao cao do an bang tieng Anh, viet bang LaTeX.
- Doc/Report.pdf: file PDF duoc bien dich bang pdflatex.
- Readme.txt: tep huong dan nay.

3. Yeu cau moi truong
- Node.js 20 tro len.
- npm 10 tro len.
- Trinh duyet hien dai co WebGL2: Chrome, Edge, Firefox.
- Python 3 chi can khi muon chay Release bang local static server.

4. Cach chay tu ma nguon
Mo terminal tai thu muc:
CS105_Geometry_Studio/Source

Chay cac lenh:
npm install
npm run dev

Sau do mo dia chi Vite hien tren terminal, thuong la:
http://localhost:5173

5. Cach chay ban Release
Mo terminal tai thu muc:
CS105_Geometry_Studio/Release

Chay:
python3 -m http.server 8080

Sau do mo:
http://localhost:8080

Khuyen nghi dung local server thay vi double-click index.html de viec import model va texture hoat dong on dinh.

6. Chuc nang chinh
- Tao hinh: Cube, Sphere, Cone, Cylinder, Wheel/Torus, Teapot, Torus Knot, Parametric Surface, Extruded Star va cac hinh mo rong trong ma nguon.
- Che do ve: Solid, Points, Lines. Che do Lines dung WireframeGeometry + LineSegments de ve day du canh cua vat the.
- Phep chieu phoi canh: dieu chinh camera position, FOV, Near, Far; co preset Front, Top, Iso, Reset.
- Bien doi affine: Move, Rotate, Scale bang TransformControls; co nhap so truc X/Y/Z va chuyen World/Local Space.
- Anh sang: Ambient, Directional, Point, Spot; dieu chinh color, intensity, position; bat/tat helper va shadow.
- Texture: texture mau Checker/UV/Grid, xoa texture, upload bitmap image va dieu chinh repeat X/Y.
- Model loading: ho tro GLB, GLTF, OBJ, STL; model duoc can giua, scale ve kich thuoc hop ly va tham gia outliner/transform.
- Animation: Spin, Orbit, Bounce, Pulse, Light Sweep; nut Cinematic Demo tao nhanh canh trinh dien.
- Hien thi: Grid, Axes, FPS, outline doi tuong dang chon, toast thong bao loi/thanh cong.
- Luu/mo scene JSON: luu lai object, camera, light, display va animation de tiep tuc demo sau.
- Undo/Redo: ho tro quay lai thao tac them/xoa/sua object, camera, light va display.
- Duplicate/Rename: sao chep va doi ten vat the trong Outliner.
- Drag & Drop: keo tha model hoac texture vao viewport de nap nhanh.
- Evaluation Tour: tao canh cham bai tu dong, gom primitives, render mode, projection, affine transform, lighting, texture, model va animation.
- Screenshot: xuat anh PNG cua viewport.
- Telemetry: hien thi FPS, draw calls, triangles, lines, points, geometry count, texture count va object count.

7. Phim tat
- T: Move / Translate.
- R: Rotate.
- S: Scale.
- Space: Play/Pause animation.
- Delete hoặc Backspace: xoa doi tuong dang chon.
- Ctrl+Z: Undo.
- Ctrl+Y hoặc Ctrl+Shift+Z: Redo.
- Ctrl+S: xuat scene JSON.
- Chuot trai tren vat the: chon doi tuong.
- Chuot phai/keo/scroll: orbit, pan, zoom bang OrbitControls.

8. Kiem tra nhanh truoc khi nop
- Chay duoc Release bang python3 -m http.server.
- Canvas 3D hien thi cube, torus, sphere mac dinh.
- Them duoc Cube/Sphere/Cone/Cylinder/Torus/Teapot.
- Doi tung vat the sang Solid, Points, Lines.
- Dieu chinh FOV/Near/Far va thay doi camera preset.
- Dung Move/Rotate/Scale bang gizmo hoac phim T/R/S.
- Bat/tat shadow, doi light color/intensity/position.
- Upload bitmap texture va thay doi Repeat X/Y.
- Import thu mot file .glb, .gltf, .obj hoac .stl.
- Chay Cinematic Demo va Play/Pause animation.
- Chay Evaluation Tour de thay toan bo yeu cau do an trong mot canh.
- Bam Save JSON, sau do Load JSON de kiem tra scene persistence.
- Dung Undo/Redo sau khi them/xoa/doi render mode.

9. Kien truc source code
- editor/: type chung, scene document JSON va command history.
- scene/: geometry primitives, material/render mode, light/stage va importers.
- renderer/: cau hinh WebGLRenderer, EffectComposer, OutlinePass va resize co gioi han pixel budget.
- animation/: cap nhat animation theo delta time.
- ui/: template giao dien.
- utils/: DOM helper va ResourceTracker de dispose geometry/material/texture/object URL.

10. Bien dich bao cao
Mo terminal tai thu muc:
CS105_Geometry_Studio/Doc

Chay:
pdflatex Report.tex
pdflatex Report.tex

Lenh chay 2 lan de cap nhat muc luc va tham chieu.

11. Dong goi
Nen nen toan bo thu muc CS105_Geometry_Studio thanh file:
StudentID.zip

Doi ten StudentID thanh ma so sinh vien truoc khi nop len courses.uit.edu.vn.

Co the tao file zip bang lenh:
./make_submission.sh StudentID

Script nay se loai bo node_modules va cac artifact test de file nop gon hon.
