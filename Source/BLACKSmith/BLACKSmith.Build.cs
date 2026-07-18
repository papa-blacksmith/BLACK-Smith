using UnrealBuildTool;
public class BLACKSmith : ModuleRules { public BLACKSmith(ReadOnlyTargetRules Target):base(Target){PCHUsage=PCHUsageMode.UseExplicitOrSharedPCHs;PublicDependencyModuleNames.AddRange(new string[]{"Core","CoreUObject","Engine","InputCore","EnhancedInput","UMG","Slate","SlateCore","Niagara","LevelSequence","MovieScene","OnlineSubsystem","OnlineSubsystemUtils",
            "Json",
            "JsonUtilities"});if(Target.Platform==UnrealTargetPlatform.Win64){DynamicallyLoadedModuleNames.Add("OnlineSubsystemSteam");}}}
