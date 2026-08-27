namespace MaterialApi.Models;

public class Material
{
    public string Identifier { get; set; } = "";
    public string Revision { get; set; } = "";
    public string UniqueIdentifier { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string UnitOfMeasure { get; set; } = "";
    public string LogisticClassIdentifier { get; set; } = "";
    public string MaterialClass { get; set; } = "";
    public decimal? VolumeValue { get; set; }
    public string VolumeUnitOfMeasure { get; set; } = "";
    public decimal? WeightValue { get; set; }
    public string WeightUnitOfMeasure { get; set; } = "";
}