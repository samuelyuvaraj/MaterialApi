using System;

namespace MaterialApi.Models;

public class IGQCResultDecisionRequest
{
    public string AssignmentId { get; set; } = "";
    public string Status { get; set; } = "";
    public string Remarks { get; set; } = "";
}

public class IGQCResultDecision
{
    public string DecisionId { get; set; } = "";
    public string AssignmentId { get; set; } = "";

    public string ResultId { get; set; } = "";
    public string MaterialId { get; set; } = "";
    public string MaterialName { get; set; } = "";
    public string Po { get; set; } = "";
    public string So { get; set; } = "";
    public string Grn { get; set; } = "";

    public string TestingType { get; set; } = "";
    public string TestParameter { get; set; } = "";
    public string Specification { get; set; } = "";
    public string ActualResult { get; set; } = "";
    public string Conformance { get; set; } = "";

    public string ResultStatus { get; set; } = "";

    public string Status { get; set; } = "";
    public string Remarks { get; set; } = "";

    public string DecisionDate { get; set; } = "";
    public string DecisionTime { get; set; } = "";

    public string Vendor { get; set; } = "";
}
