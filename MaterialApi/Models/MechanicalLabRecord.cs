namespace MaterialApi.Models;

public class MechanicalLabRecord
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

    public string Vendor { get; set; } = "";

    public string MechanicalGrade { get; set; } = "";
    public decimal? MechanicalQuantity { get; set; }
    public string MechanicalEquipment { get; set; } = "";
    public string MechanicalSampleConsumed { get; set; } = "";

    public string MechanicalStatus { get; set; } = "Pending";

    public string AcceptedDate { get; set; } = "";
    public string AcceptedTime { get; set; } = "";
}