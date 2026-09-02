namespace MaterialApi.Models;

public class ChemicalLabResultRecord
{
    public string ResultId { get; set; } = "";
    public string AssignmentId { get; set; } = "";
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Vendor { get; set; } = "";
    public string Grn { get; set; } = "";
    public string Unit { get; set; } = "";
    public string ChemicalGrade { get; set; } = "";
    public decimal? ChemicalQuantity { get; set; }
    public string ChemicalEquipment { get; set; } = "";
    public string ChemicalSampleConsumed { get; set; } = "";
    public string ChemicalStatus { get; set; } = "";
    public string AcceptedDate { get; set; } = "";
    public string AcceptedTime { get; set; } = "";
    public string ResultStatus { get; set; } = "Pending";
    public string ResultEntryDate { get; set; } = "";
    public string ResultEntryTime { get; set; } = "";
    public List<ChemicalLabResultRow> Results { get; set; } = new();
}

public class ChemicalLabResultRow
{
    public int Sno { get; set; }
    public string TestParameter { get; set; } = "";
    public string Specification { get; set; } = "";
    public string Result { get; set; } = "";
    public string Conformance { get; set; } = "Pending";
}

public class ChemicalLabResultSaveRequest
{
    public string AssignmentId { get; set; } = "";
    public List<ChemicalLabResultRowRequest> Results { get; set; } = new();
}

public class ChemicalLabResultRowRequest
{
    public string TestParameter { get; set; } = "";
    public string Specification { get; set; } = "";
    public string Result { get; set; } = "";
}
