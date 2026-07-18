#include "BSBrowserWeaponImporter.h"

#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
    void ReadOptionalNumber(
        const TSharedPtr<FJsonObject>& Object,
        const TCHAR* Field,
        float& OutValue
    )
    {
        double Number = 0.0;

        if (
            Object.IsValid() &&
            Object->TryGetNumberField(Field, Number)
        )
        {
            OutValue = static_cast<float>(Number);
        }
    }
}

bool UBSBrowserWeaponImporter::ImportBrowserWeaponJson(
    const FString& Json,
    FBSShapeInput& OutShape,
    TArray<FBSOreSlotInput>& OutOres,
    FString& OutWeaponName
)
{
    OutShape = FBSShapeInput();
    OutOres.Reset();
    OutWeaponName.Reset();

    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader =
        TJsonReaderFactory<>::Create(Json);

    if (
        !FJsonSerializer::Deserialize(Reader, Root) ||
        !Root.IsValid()
    )
    {
        return false;
    }

    Root->TryGetStringField(TEXT("name"), OutWeaponName);
    OutShape.ShapeJson = Json;

    const TSharedPtr<FJsonObject>* ShapeObject = nullptr;

    if (
        Root->TryGetObjectField(TEXT("shape"), ShapeObject) &&
        ShapeObject &&
        ShapeObject->IsValid()
    )
    {
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("lengthCm"),
            OutShape.LengthCm
        );
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("averageWidthCm"),
            OutShape.AverageWidthCm
        );
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("thicknessCm"),
            OutShape.ThicknessCm
        );
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("curvature"),
            OutShape.Curvature
        );
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("serration"),
            OutShape.Serration
        );
        ReadOptionalNumber(
            *ShapeObject,
            TEXT("holeRatio"),
            OutShape.HoleRatio
        );
    }

    const TArray<TSharedPtr<FJsonValue>>* OreValues = nullptr;

    if (Root->TryGetArrayField(TEXT("forgeOres"), OreValues))
    {
        for (const TSharedPtr<FJsonValue>& Value : *OreValues)
        {
            const TSharedPtr<FJsonObject>* OreObject = nullptr;

            if (
                !Value.IsValid() ||
                !Value->TryGetObject(OreObject) ||
                !OreObject ||
                !OreObject->IsValid()
            )
            {
                continue;
            }

            FString OreId;
            FString OreName;

            (*OreObject)->TryGetStringField(TEXT("id"), OreId);
            (*OreObject)->TryGetStringField(TEXT("name"), OreName);

            if (OreId.IsEmpty() && OreName.IsEmpty())
            {
                continue;
            }

            FBSOreSlotInput Ore;
            Ore.OreId = FName(*OreId);
            Ore.OreName = FName(*OreName);
            OutOres.Add(Ore);

            if (OutOres.Num() >= 5)
            {
                break;
            }
        }
    }

    return true;
}
