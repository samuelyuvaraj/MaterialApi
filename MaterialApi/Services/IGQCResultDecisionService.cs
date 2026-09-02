using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

/*
 * Overall IGQC final decision store.
 *
 * IMPORTANT:
 * This is NOT the Chemical Lab Result Excel.
 * Chemical Lab Result remains the source for Chemical test results.
 *
 * This workbook is the overall IGQC final decision/audit store:
 * - all result rows
 * - final Approved/Rejected decision
 * - remarks
 * - decision date/time
 *
 * Keeping this separate makes future Mechanical/Dimensional result
 * integration easier without changing the Chemical Lab workbook.
 */
public class IGQCResultDecisionService
{
    private readonly ChemicalLabResultService _chemicalResultService;
    private readonly string _excelPath;

    private static readonly object FileLock = new();

    private static readonly string[] Headers =
    {
        "Decision ID",
        "Assignment ID",
        "Result ID",
        "Date",
        "Time",
        "PO",
        "SO",
        "Material ID",
        "Material Name",
        "GRN",
        "Testing Type",
        "S.No",
        "Test Parameter",
        "Specification / Expected Result",
        "Actual Result",
        "Conformance",
        "Result Status",
        "IGQC Decision",
        "Remarks",
        "Decision Date",
        "Decision Time",
        "Vendor"
    };

    public IGQCResultDecisionService(
        ChemicalLabResultService chemicalResultService)
    {
        _chemicalResultService = chemicalResultService;

        _excelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "IGQC_Final_Result_Data.xlsx");
    }

    public List<IGQCResultDecision> GetAll()
    {
        lock (FileLock)
        {
            if (!File.Exists(_excelPath))
                return new List<IGQCResultDecision>();

            using var workbook = new XLWorkbook(_excelPath);

            var ws = workbook.Worksheets
                .FirstOrDefault(x => x.Name == "IGQC Final Results");

            if (ws == null || ws.LastRowUsed() == null)
                return new List<IGQCResultDecision>();

            return ws.RowsUsed()
                .Skip(1)
                .Where(r => !string.IsNullOrWhiteSpace(r.Cell(2).GetString()))
                .Select(ReadRow)
                .ToList();
        }
    }

    public IGQCResultDecision? GetByAssignmentId(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            return null;

        /*
         * The last row for an assignment is authoritative.
         * Complete() writes all result rows using the same decision ID,
         * so we can return one summary decision here.
         */
        return GetAll()
            .Where(x => Same(x.AssignmentId, assignmentId))
            .OrderByDescending(x => x.DecisionDate)
            .ThenByDescending(x => x.DecisionTime)
            .FirstOrDefault();
    }

    public IGQCResultDecision Save(
        IGQCResultDecisionRequest request)
    {
        ValidateRequest(request);

        var result =
            _chemicalResultService.GetByAssignmentId(
                request.AssignmentId);

        if (result == null)
            throw new KeyNotFoundException(
                "Completed Chemical Lab result was not found for this assignment.");

        var rows = result.Results ?? new List<ChemicalLabResultRow>();

        if (rows.Count == 0)
            throw new ArgumentException(
                "No test result rows exist for this assignment.");

        /*
         * Approval is allowed only when every recorded result is conforming.
         * Rejection is allowed for any completed result and requires remarks.
         */
       

        if (Same(request.Status, "Rejected") &&
            string.IsNullOrWhiteSpace(request.Remarks))
        {
            throw new ArgumentException(
                "Remarks are required when rejecting the IGQC result.");
        }

        var now = DateTime.Now;

        var decisionId =
            $"IGD-{now:yyyyMMddHHmmssfff}";

        lock (FileLock)
        {
            Directory.CreateDirectory(
                Path.GetDirectoryName(_excelPath)!);

            using var workbook =
                File.Exists(_excelPath)
                    ? new XLWorkbook(_excelPath)
                    : new XLWorkbook();

            var ws =
                workbook.Worksheets
                    .FirstOrDefault(
                        x => x.Name == "IGQC Final Results")
                ?? workbook.Worksheets.Add(
                    "IGQC Final Results");

            EnsureHeaders(ws);

            /*
             * One decision replaces the previous decision for the same
             * assignment. This prevents duplicate audit rows after a user
             * retries the same decision.
             */
            var existing =
                ws.RowsUsed()
                    .Skip(1)
                    .Where(r =>
                        Same(
                            r.Cell(2).GetString(),
                            request.AssignmentId))
                    .ToList();

            foreach (var row in existing)
                row.Delete();

            var rowNumber =
                (ws.LastRowUsed()?.RowNumber() ?? 1) + 1;

            foreach (var testRow in rows)
            {
                var values = new object?[]
                {
                    decisionId,
                    result.AssignmentId,
                    result.ResultId,
                    result.Date,
                    result.Time,
                    result.Po,
                    result.So,
                    result.MaterialId,
                    result.MaterialName,
                    result.Grn,
                    "Chemical",
                    testRow.Sno,
                    testRow.TestParameter,
                    testRow.Specification,
                    testRow.Result,
                    testRow.Conformance,
                    result.ResultStatus,
                    request.Status.Trim(),
                    request.Remarks?.Trim() ?? "",
                    now.ToString("yyyy-MM-dd"),
                    now.ToString("HH:mm:ss"),
                    result.Vendor
                };

                WriteValues(
                    ws,
                    rowNumber,
                    values);

                rowNumber++;
            }

            ws.Row(1).Style.Font.Bold = true;
            ws.Columns(1, Headers.Length).AdjustToContents();

            workbook.SaveAs(_excelPath);
        }

        return new IGQCResultDecision
        {
            DecisionId = decisionId,
            AssignmentId = result.AssignmentId,
            ResultId = result.ResultId,
            MaterialId = result.MaterialId,
            MaterialName = result.MaterialName,
            Po = result.Po,
            So = result.So,
            Grn = result.Grn,
            TestingType = "Chemical",
            ResultStatus = result.ResultStatus,
            Status = request.Status.Trim(),
            Remarks = request.Remarks?.Trim() ?? "",
            DecisionDate = now.ToString("yyyy-MM-dd"),
            Vendor = result.Vendor,
            DecisionTime = now.ToString("HH:mm:ss")
        };
    }

    private static void ValidateRequest(
        IGQCResultDecisionRequest request)
    {
        if (request == null)
            throw new ArgumentException(
                "IGQC decision request is required.");

        if (string.IsNullOrWhiteSpace(request.AssignmentId))
            throw new ArgumentException(
                "Assignment ID is required.");

        if (!Same(request.Status, "Approved") &&
            !Same(request.Status, "Rejected"))
        {
            throw new ArgumentException(
                "Decision must be Approved or Rejected.");
        }
    }

    private static IGQCResultDecision ReadRow(IXLRow row)
    {
        return new IGQCResultDecision
        {
            DecisionId = S(row, 1),
            AssignmentId = S(row, 2),
            ResultId = S(row, 3),
            Po = S(row, 6),
            So = S(row, 7),
            MaterialId = S(row, 8),
            MaterialName = S(row, 9),
            Grn = S(row, 10),
            TestingType = S(row, 11),
            TestParameter = S(row, 13),
            Specification = S(row, 14),
            ActualResult = S(row, 15),
            Conformance = S(row, 16),
            ResultStatus = S(row, 17),
            Status = S(row, 18),
            Remarks = S(row, 19),
            DecisionDate = S(row, 20),
            DecisionTime = S(row, 21),
            Vendor = S(row, 22)
        };
    }

    private static void EnsureHeaders(IXLWorksheet ws)
    {
        for (var i = 0; i < Headers.Length; i++)
            ws.Cell(1, i + 1).Value = Headers[i];
    }

    private static void WriteValues(
        IXLWorksheet ws,
        int row,
        object?[] values)
    {
        for (var i = 0; i < values.Length; i++)
        {
            var value = values[i];

            if (value == null)
            {
                ws.Cell(row, i + 1).Clear();
            }
            else if (value is string text)
            {
                ws.Cell(row, i + 1).Value = text;
            }
            else if (value is int intValue)
            {
                ws.Cell(row, i + 1).Value = intValue;
            }
            else if (value is decimal decimalValue)
            {
                ws.Cell(row, i + 1).Value = decimalValue;
            }
            else
            {
                ws.Cell(row, i + 1).Value =
                    value.ToString() ?? "";
            }
        }
    }

    private static string S(IXLRow row, int column) =>
        row.Cell(column).GetString().Trim();

    private static bool Same(
        string? a,
        string? b) =>
        string.Equals(
            a?.Trim(),
            b?.Trim(),
            StringComparison.OrdinalIgnoreCase);
}
