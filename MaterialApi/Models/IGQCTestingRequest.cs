using System.Text.Json.Serialization;

namespace MaterialApi.Models;

public class IGQCTestingSelection
{
    public bool Selected { get; set; }

    public string GradeId { get; set; } = "";

    public decimal? Quantity { get; set; }
}

public class IGQCTestingRequest
{
    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string Grn { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Unit { get; set; } = "";
    public string Status { get; set; } = "";

    public decimal? Received { get; set; }
    public decimal? Available { get; set; }
    public decimal? Consumed { get; set; }

    public IGQCTestingSelection Chemical { get; set; } = new();
    public IGQCTestingSelection Mechanical { get; set; } = new();
    public IGQCTestingSelection Dimensional { get; set; } = new();
}

public class IGQCTestingAssignment
{
    public string AssignmentId { get; set; } = "";
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";

    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string Grn { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Unit { get; set; } = "";

    public bool ChemicalTesting { get; set; }
    public bool MechanicalTesting { get; set; }
    public bool DimensionalTesting { get; set; }

    public string ChemicalGrade { get; set; } = "";
    public string MechanicalGrade { get; set; } = "";
    public string DimensionalGrade { get; set; } = "";

    public decimal? ChemicalQuantity { get; set; }
    public decimal? MechanicalQuantity { get; set; }
    public decimal? DimensionalQuantity { get; set; }

    public string ChemicalEquipment { get; set; } = "";
    public string MechanicalEquipment { get; set; } = "";
    public string DimensionalEquipment { get; set; } = "";

    public string ChemicalSampleConsumed { get; set; } = "";
    public string MechanicalSampleConsumed { get; set; } = "";
    public string DimensionalSampleConsumed { get; set; } = "";

    public string ChemicalStatus { get; set; } = "Pending";

    public string MechanicalStatus { get; set; } = "Pending";

    public string DimensionalStatus { get; set; } = "Pending";

    [JsonIgnore]
    public string DateTime => $"{Date} {Time}";
}
