namespace MaterialApi.Models;

public class ChemicalLabRecord
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

    // Chemical testing only
    public string ChemicalGrade { get; set; } = "";
    public decimal? ChemicalQuantity { get; set; }
    public string ChemicalEquipment { get; set; } = "";
    public string ChemicalSampleConsumed { get; set; } = "";

    public string ChemicalStatus { get; set; } = "Pending";

    public string AcceptedDate { get; set; } = "";
    public string AcceptedTime { get; set; } = "";
}