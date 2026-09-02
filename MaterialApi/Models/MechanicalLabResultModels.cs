namespace MaterialApi.Models;

public class MechanicalLabResult
{
    public string ResultId { get; set; } = "";
    public string AssignmentId { get; set; } = "";
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Grn { get; set; } = "";
    public string Unit { get; set; } = "";

    public string MechanicalGrade { get; set; } = "";
    public decimal? MechanicalQuantity { get; set; }
    public string MechanicalEquipment { get; set; } = "";
    public string MechanicalSampleConsumed { get; set; } = "";
    public string MechanicalStatus { get; set; } = "";

    public string AcceptedDate { get; set; } = "";
    public string AcceptedTime { get; set; } = "";

    public int Sno { get; set; }
    public string TestParameter { get; set; } = "";
    public string Specification { get; set; } = "";
    public string ActualResult { get; set; } = "";
    public string Conformance { get; set; } = "";

    public string ResultStatus { get; set; } = "";
    public string ResultEntryDate { get; set; } = "";
    public string ResultEntryTime { get; set; } = "";

    public string Vendor { get; set; } = "";

    public List<MechanicalLabResultRow> Results { get; set; } = new();
}

public class MechanicalLabResultRow
{
    public int Sno { get; set; }

    public string TestParameter { get; set; } = "";

    public string Specification { get; set; } = "";

    public string ActualResult { get; set; } = "";

    public string Conformance { get; set; } = "";
}

public class MechanicalLabResultSaveRequest
{
    public string AssignmentId { get; set; } = "";

    public List<MechanicalLabResultRow> Results { get; set; } = new();
}