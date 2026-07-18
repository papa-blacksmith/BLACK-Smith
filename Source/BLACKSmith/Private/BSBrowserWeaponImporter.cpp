#include "BSBrowserWeaponImporter.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

bool UBSBrowserWeaponImporter::ImportBrowserWeaponJson(
    const FString& Json,
    FBSShapeInput& OutShape,
    TArray<FBSOreSlotInput>& OutOres,
    FString& OutWeaponName
)
{
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);

    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
    {
        return false;
    }

    OutWeaponName = Root->GetStringField(TEXT("name"));
    OutShape.ShapeJson = Json;

    if (const TSharedPtr<FJsonObject>* ShapeObject = nullptr; Root->TryGetObjectField(TEXT("shape"), ShapeObject))
    {
        OutShape.LengthCm = (*ShapeObject)->GetNumberField(TEXT("lengthCm"));
        OutShape.AverageWidthCm = (*ShapeObject)->GetNumberField(TEXT("averageWidthCm"));
        OutShape.ThicknessCm = (*ShapeObject)->GetNumberField(TEXT("thicknessCm"));
        OutShape.Curvature = (*ShapeObject)->GetNumberField(TEXT("curvature"));
        OutShape.Serration = (*ShapeObject)->GetNumberField(TEXT("serration"));
        OutShape.HoleRatio = (*ShapeObject)->GetNumberField(TEXT("holeRatio"));
    }

    const TArray<TSharedPtr<FJsonValue>>* Ores = nullptr;
    if (Root->TryGetArrayField(TEXT("forgeOres"), Ores))
    {
        for (const TSharedPtr<FJsonValue>& Value : *Ores)
        {
            const TSharedPtr<FJsonObject> OreObject = Value->AsObject();
            if (!OreObject.IsValid())
            {
                continue;
            }

            FBSOreSlotInput Ore;
            Ore.OreId = FName(*OreObject->GetStringField(TEXT("id")));
            Ore.OreName = FName(*OreObject->GetStringField(TEXT("name")));
            OutOres.Add(Ore);
        }
    }

    return true;
}
