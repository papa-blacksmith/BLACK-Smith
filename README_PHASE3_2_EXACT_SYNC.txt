BLACK Smith Ver0.7 Phase 3-2 Exact 3D Sync

実装:
- 2D drawEditorと3Dで同じsampleWeaponGeometry()を共有
- ベジェ曲線を約300頂点へ細分化
- 選択中パーツだけを3D表示
- 2Dの反り、局所幅、上側幅、下側幅、刃先を一致
- 表面、裏面、外周側面を手動BufferGeometryで生成
- 刃先へ向かう厚みテーパー
- requestAnimationFrame単位で更新を集約
- 自己交差を検出した場合は前回の正常メッシュを維持
- 三角形分割失敗時も前回メッシュを維持

注意:
全パーツ同時表示と親子ソケット追従は、Phase 3-2の同期確認後に復活させます。
