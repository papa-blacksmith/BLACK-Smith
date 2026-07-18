import unreal
ROOT="/Game/BLACKSmith"
FOLDERS=[f"{ROOT}/Maps",f"{ROOT}/Characters/Player",f"{ROOT}/Characters/NPC",f"{ROOT}/Weapons/Generator",f"{ROOT}/Weapons/Materials",f"{ROOT}/Forge",f"{ROOT}/Niagara/Fire",f"{ROOT}/Niagara/Sparks",f"{ROOT}/Niagara/Smoke",f"{ROOT}/Niagara/Steam",f"{ROOT}/Sequencer/Opening",f"{ROOT}/UI/Title",f"{ROOT}/UI/HUD",f"{ROOT}/Audio"]
for folder in FOLDERS:
    if not unreal.EditorAssetLibrary.does_directory_exist(folder): unreal.EditorAssetLibrary.make_directory(folder)
def make_level(path):
    if not unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.EditorLevelLibrary.new_level(path);unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True,True)
def make_sequence(path,name):
    asset=f"{path}/{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(asset): return unreal.load_asset(asset)
    seq=unreal.AssetToolsHelpers.get_asset_tools().create_asset(name,path,unreal.LevelSequence,unreal.LevelSequenceFactoryNew())
    if seq:
        seq.set_display_rate(unreal.FrameRate(30,1));seq.set_playback_start(0);seq.set_playback_end(600);unreal.EditorAssetLibrary.save_loaded_asset(seq)
    return seq
make_level(f"{ROOT}/Maps/L_Title")
make_level(f"{ROOT}/Maps/L_Workshop")
make_sequence(f"{ROOT}/Sequencer/Opening","LS_Opening_20s")
unreal.log("[BLACK Smith] Base assets created")
