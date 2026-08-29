namespace MaterialApi.Models;

public class IGQCTestingAssignments
{
    public string AssignmentId { get; set; } = "";
    public DateTime DateTime { get; set; }
    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string Grn { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Unit { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal Received { get; set; }
    public decimal Available { get; set; }
    public decimal Consumed { get; set; }

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

    public string ChemicalExpectedResult { get; set; } = "";
    public string MechanicalExpectedResult { get; set; } = "";
    public string DimensionalExpectedResult { get; set; } = "";

    public string ChemicalStatus { get; set; } = "Pending";

    public string MechanicalStatus { get; set; } = "Pending";

    public string DimensionalStatus { get; set; } = "Pending";
}
