import unreal
MAP="/Game/BLACKSmith/Maps/L_Workshop"
unreal.EditorLoadingAndSavingUtils.load_map(MAP)
def cube(label,location,scale):
    a=unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor,unreal.Vector(*location),unreal.Rotator())
    a.set_actor_label(label);a.set_actor_scale3d(unreal.Vector(*scale));return a
cube("Floor",(0,0,-50),(16,12,1));cube("Forge",(-450,-400,90),(2.2,1.5,1.8));cube("Anvil",(0,-100,60),(1.4,.7,.7));cube("Workbench",(420,120,60),(2.4,1,.7));cube("Storage",(700,-600,90),(1.5,1,1.2));cube("OreShelf",(300,-1000,150),(2,.6,2.8));cube("Exit",(-1000,300,140),(1.2,.5,2.6))
unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.DirectionalLight,unreal.Vector(0,0,600),unreal.Rotator(-35,-45,0))
unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.SkyLight,unreal.Vector(0,0,500),unreal.Rotator())
unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True,True)
unreal.log("[BLACK Smith] Workshop blockout generated")
