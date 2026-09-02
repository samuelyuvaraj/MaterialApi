using ClosedXML.Excel;
using MaterialApi.Models;
using System.Globalization;
using System.Text.RegularExpressions;

namespace MaterialApi.Services;

public class ChemicalLabResultService
{
    private readonly IGQCTestingService _igqcService;
    private readonly ChemicalLabService _chemicalLabService;
    private readonly string _excelPath;

    private static readonly object _lock = new();

    private static readonly string[] Headers =
    {
        "Result ID",
        "Assignment ID",
        "Date",
        "Time",
        "PO",
        "SO",
        "Material ID",
        "Material Name",
        "GRN",
        "Unit",
        "Chemical Grade",
        "Chemical Quantity",
        "Chemical Equipment",
        "Chemical Sample Consumed",
        "Chemical Status",
        "Accepted Date",
        "Accepted Time",
        "S.No",
        "Test Parameter",
        "Specification / Expected Result",
        "Actual Result",
        "Conformance",
        "Result Status",
        "Result Entry Date",
        "Result Entry Time",
        "Vendor"
    };

    public ChemicalLabResultService(
        IGQCTestingService igqcService,
        ChemicalLabService chemicalLabService)
    {
        _igqcService = igqcService;
        _chemicalLabService = chemicalLabService;

        _excelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "Chemical_Lab_Result_Data.xlsx"
        );
    }

    // =========================================================
    // GET ACCEPTED CHEMICAL LAB ASSIGNMENTS
    // SOURCE = Chemical_Lab_Data.xlsm
    // =========================================================

    public List<ChemicalLabResultRecord> GetAcceptedAssignments()
    {
        var chemicalRecords = _chemicalLabService
            .GetAll()
            .Where(x =>
                string.Equals(
                    x.ChemicalStatus,
                    "Accepted",
                    StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => $"{x.Date} {x.Time}")
            .ToList();

        var saved = GetSavedResults();

        var output = new List<ChemicalLabResultRecord>();

        foreach (var chemical in chemicalRecords)
        {
            var record = ToRecord(chemical);

            var savedRows = saved
                .Where(x =>
                    Same(
                        x.AssignmentId,
                        chemical.AssignmentId))
                .OrderBy(x => x.Sno)
                .ToList();

            if (savedRows.Count > 0)
            {
                var first = savedRows[0];

                record.ResultId = first.ResultId;
                record.ResultStatus = first.ResultStatus;
                record.ResultEntryDate = first.ResultEntryDate;
                record.ResultEntryTime = first.ResultEntryTime;

                record.Results = savedRows
                    .Select(x => new ChemicalLabResultRow
                    {
                        Sno = x.Sno,
                        TestParameter = x.TestParameter,
                        Specification = x.Specification,
                        Result = x.ActualResult,
                        Conformance = x.Conformance
                    })
                    .ToList();
            }

            output.Add(record);
        }

        return output;
    }

    // =========================================================
    // GET ONE ACCEPTED CHEMICAL ASSIGNMENT
    // =========================================================

    public ChemicalLabResultRecord? GetByAssignmentId(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            return null;

        return GetAcceptedAssignments()
            .FirstOrDefault(x =>
                Same(x.AssignmentId, assignmentId));
    }

    // =========================================================
    // COMPLETE CHEMICAL LAB RESULT
    // =========================================================

    public ChemicalLabResultRecord Complete(
        ChemicalLabResultSaveRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.AssignmentId))
        {
            throw new ArgumentException(
                "Assignment ID is required.");
        }

        // IMPORTANT:
        // Get the accepted record from Chemical Lab,
        // NOT directly from IGQC status.
        var chemicalAssignment =
            _chemicalLabService.GetByAssignmentId(
                request.AssignmentId);

        if (chemicalAssignment == null)
        {
            throw new KeyNotFoundException(
                "Chemical Lab assignment not found.");
        }

        if (!string.Equals(
                chemicalAssignment.ChemicalStatus,
                "Accepted",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Chemical Lab assignment must be Accepted before entering results.");
        }

        if (request.Results == null ||
            request.Results.Count == 0)
        {
            throw new ArgumentException(
                "Add at least one Chemical Lab result row.");
        }

        var rows =
            new List<ChemicalLabResultRow>();

        var sno = 1;

        foreach (var input in request.Results)
        {
            var parameter =
                input.TestParameter?.Trim() ?? "";

            var specification =
                input.Specification?.Trim() ?? "";

            var result =
                input.Result?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(parameter))
            {
                throw new ArgumentException(
                    $"Test Parameter is required for row {sno}.");
            }

            if (string.IsNullOrWhiteSpace(specification))
            {
                throw new ArgumentException(
                    $"Specification / Expected Result is required for row {sno}.");
            }

            if (string.IsNullOrWhiteSpace(result))
            {
                throw new ArgumentException(
                    $"Actual Result is required for row {sno}.");
            }

            rows.Add(new ChemicalLabResultRow
            {
                Sno = sno++,
                TestParameter = parameter,
                Specification = specification,
                Result = result,
                Conformance =
                    Evaluate(
                        specification,
                        result)
            });
        }

        var now = DateTime.Now;

        var resultId =
            $"CLR-{now:yyyyMMddHHmmssfff}";

        var overall =
            rows.All(x =>
                Same(
                    x.Conformance,
                    "Conforming"))
                ? "Completed"
                : "Completed - Not Conforming";

        // =====================================================
        // SAVE CHEMICAL RESULT EXCEL
        // =====================================================

        lock (_lock)
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
                        x => x.Name == "Chemical Lab Results")
                ?? workbook.Worksheets.Add(
                    "Chemical Lab Results");

            EnsureHeaders(ws);

            // Remove previous rows for same assignment
            var existing =
                ws.RowsUsed()
                    .Skip(1)
                    .Where(r =>
                        Same(
                            r.Cell(2).GetString(),
                            chemicalAssignment.AssignmentId))
                    .ToList();

            foreach (var row in existing)
                row.Delete();

            var rowNumber =
                (ws.LastRowUsed()?.RowNumber() ?? 1) + 1;

            foreach (var row in rows)
            {
                ws.Cell(rowNumber, 1).Value =
                    resultId;

                ws.Cell(rowNumber, 2).Value =
                    chemicalAssignment.AssignmentId;

                ws.Cell(rowNumber, 3).Value =
                    chemicalAssignment.Date;

                ws.Cell(rowNumber, 4).Value =
                    chemicalAssignment.Time;

                ws.Cell(rowNumber, 5).Value =
                    chemicalAssignment.Po;

                ws.Cell(rowNumber, 6).Value =
                    chemicalAssignment.So;

                ws.Cell(rowNumber, 7).Value =
                    chemicalAssignment.MaterialId;

                ws.Cell(rowNumber, 8).Value =
                    chemicalAssignment.MaterialName;

                ws.Cell(rowNumber, 9).Value =
                    chemicalAssignment.Grn;

                ws.Cell(rowNumber, 10).Value =
                    chemicalAssignment.Unit;

                ws.Cell(rowNumber, 11).Value =
                    chemicalAssignment.ChemicalGrade;

                if (chemicalAssignment.ChemicalQuantity.HasValue)
                {
                    ws.Cell(rowNumber, 12).Value =
                        chemicalAssignment.ChemicalQuantity.Value;
                }

                ws.Cell(rowNumber, 13).Value =
                    chemicalAssignment.ChemicalEquipment;

                ws.Cell(rowNumber, 14).Value =
                    chemicalAssignment.ChemicalSampleConsumed;

                ws.Cell(rowNumber, 15).Value =
                    chemicalAssignment.ChemicalStatus;

                ws.Cell(rowNumber, 16).Value =
                    chemicalAssignment.AcceptedDate;

                ws.Cell(rowNumber, 17).Value =
                    chemicalAssignment.AcceptedTime;

                ws.Cell(rowNumber, 18).Value =
                    row.Sno;

                ws.Cell(rowNumber, 19).Value =
                    row.TestParameter;

                ws.Cell(rowNumber, 20).Value =
                    row.Specification;

                ws.Cell(rowNumber, 21).Value =
                    row.Result;

                ws.Cell(rowNumber, 22).Value =
                    row.Conformance;

                ws.Cell(rowNumber, 23).Value =
                    overall;

                ws.Cell(rowNumber, 24).Value =
                    now.ToString("yyyy-MM-dd");

                ws.Cell(rowNumber, 25).Value =
                    now.ToString("HH:mm:ss");

                ws.Cell(rowNumber, 26).Value =
                     chemicalAssignment.Vendor;

                rowNumber++;
            }

            ws.Row(1).Style.Font.Bold = true;

            ws.Columns(
                1,
                Headers.Length)
                .AdjustToContents();

            workbook.SaveAs(_excelPath);
        }

        // =====================================================
        // AFTER EXCEL SAVE
        // UPDATE IGQC STATUS = COMPLETED
        // =====================================================

        _igqcService.MarkChemicalResultCompleted(
            chemicalAssignment.AssignmentId);

        return new ChemicalLabResultRecord
        {
            ResultId = resultId,

            AssignmentId =
                chemicalAssignment.AssignmentId,

            Date =
                chemicalAssignment.Date,

            Time =
                chemicalAssignment.Time,

            Po =
                chemicalAssignment.Po,

            So =
                chemicalAssignment.So,

            MaterialId =
                chemicalAssignment.MaterialId,

            MaterialName =
                chemicalAssignment.MaterialName,
            Vendor =
                chemicalAssignment.Vendor,

            Grn =
                chemicalAssignment.Grn,

            Unit =
                chemicalAssignment.Unit,

            ChemicalGrade =
                chemicalAssignment.ChemicalGrade,

            ChemicalQuantity =
                chemicalAssignment.ChemicalQuantity,

            ChemicalEquipment =
                chemicalAssignment.ChemicalEquipment,

            ChemicalSampleConsumed =
                chemicalAssignment.ChemicalSampleConsumed,

            ChemicalStatus =
                chemicalAssignment.ChemicalStatus,

            ResultStatus =
                overall,

            ResultEntryDate =
                now.ToString("yyyy-MM-dd"),

            ResultEntryTime =
                now.ToString("HH:mm:ss"),

            Results =
                rows
        };
    }

    // =========================================================
    // READ SAVED RESULT EXCEL
    // =========================================================

    private List<SavedRow> GetSavedResults()
    {
        lock (_lock)
        {
            if (!File.Exists(_excelPath))
                return new();

            using var workbook =
                new XLWorkbook(_excelPath);

            var ws =
                workbook.Worksheets
                    .FirstOrDefault(
                        x => x.Name == "Chemical Lab Results");

            if (ws == null ||
                ws.LastRowUsed() == null)
            {
                return new();
            }

            return ws.RowsUsed()
                .Skip(1)
                .Where(r =>
                    !string.IsNullOrWhiteSpace(
                        r.Cell(2).GetString()))
                .Select(r => new SavedRow
                {
                    ResultId =
                        S(r, 1),

                    AssignmentId =
                        S(r, 2),

                    Sno =
                        I(r, 18),

                    TestParameter =
                        S(r, 19),

                    Specification =
                        S(r, 20),

                    ActualResult =
                        S(r, 21),

                    Conformance =
                        S(r, 22),

                    ResultStatus =
                        S(r, 23),

                    ResultEntryDate =
                        S(r, 24),

                    ResultEntryTime =
                        S(r, 25)

                })
                .ToList();
        }
    }

    // =========================================================
    // CONVERT CHEMICAL LAB RECORD
    // =========================================================

    private static ChemicalLabResultRecord ToRecord(
        ChemicalLabRecord x)
    {
        return new ChemicalLabResultRecord
        {
            AssignmentId = x.AssignmentId,
            Date = x.Date,
            Time = x.Time,

            Po = x.Po,
            So = x.So,

            MaterialId =
                x.MaterialId,

            MaterialName =
                x.MaterialName,

            Grn = x.Grn,
            Unit = x.Unit,

            Vendor = x.Vendor,

            ChemicalGrade =
                x.ChemicalGrade,

            ChemicalQuantity =
                x.ChemicalQuantity,

            ChemicalEquipment =
                x.ChemicalEquipment,

            ChemicalSampleConsumed =
                x.ChemicalSampleConsumed,

            ChemicalStatus =
                x.ChemicalStatus,

            AcceptedDate =
                x.AcceptedDate,

            AcceptedTime =
                x.AcceptedTime,

            ResultStatus =
                "Pending"
        };
    }

    // =========================================================
    // SPECIFICATION EVALUATION
    // =========================================================

    private static string Evaluate(
        string specification,
        string actual)
    {
        var spec =
            specification.Trim();

        var result =
            actual.Trim();

        // Numeric actual result
        if (decimal.TryParse(
                result,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var actualNumber))
        {
            var normalized =
                spec
                    .Replace("–", "-")
                    .Replace("—", "-")
                    .Trim();

            // Range
            var range =
                Regex.Match(
                    normalized,
                    @"^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$");

            if (range.Success)
            {
                var min =
                    decimal.Parse(
                        range.Groups[1].Value,
                        CultureInfo.InvariantCulture);

                var max =
                    decimal.Parse(
                        range.Groups[2].Value,
                        CultureInfo.InvariantCulture);

                return
                    actualNumber >= min &&
                    actualNumber <= max
                        ? "Conforming"
                        : "Not Conforming";
            }

            // Operators
            var op =
                Regex.Match(
                    normalized,
                    @"^(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$");

            if (op.Success)
            {
                var limit =
                    decimal.Parse(
                        op.Groups[2].Value,
                        CultureInfo.InvariantCulture);

                var ok =
                    op.Groups[1].Value switch
                    {
                        "<=" => actualNumber <= limit,
                        ">=" => actualNumber >= limit,
                        "<" =>
                            actualNumber < limit,
                        ">" =>
                            actualNumber > limit,
                        _ => false
                    };

                return ok
                    ? "Conforming"
                    : "Not Conforming";
            }

            // Exact number
            if (decimal.TryParse(
                    normalized,
                    NumberStyles.Float,
                    CultureInfo.InvariantCulture,
                    out var exact))
            {
                return
                    actualNumber == exact
                        ? "Conforming"
                        : "Not Conforming";
            }
        }

        // Free text
        return Same(
            specification,
            actual)
            ? "Conforming"
            : "Not Conforming";
    }

    // =========================================================
    // HEADERS
    // =========================================================

    private static void EnsureHeaders(
        IXLWorksheet ws)
    {
        for (var i = 0;
             i < Headers.Length;
             i++)
        {
            ws.Cell(1, i + 1).Value =
                Headers[i];
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private static string S(
        IXLRow row,
        int column)
    {
        return row.Cell(column)
            .GetString()
            .Trim();
    }

    private static int I(
        IXLRow row,
        int column)
    {
        return int.TryParse(
            S(row, column),
            out var value)
            ? value
            : 0;
    }

    private static bool Same(
        string? a,
        string? b)
    {
        return string.Equals(
            a?.Trim(),
            b?.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    // =========================================================
    // SAVED RESULT ROW
    // =========================================================

    private sealed class SavedRow
    {
        public string ResultId { get; set; } = "";
        public string AssignmentId { get; set; } = "";

        public int Sno { get; set; }

        public string TestParameter { get; set; } = "";

        public string Specification { get; set; } = "";

        public string ActualResult { get; set; } = "";

        public string Conformance { get; set; } = "";

        public string ResultStatus { get; set; } = "";

        public string ResultEntryDate { get; set; } = "";

        public string ResultEntryTime { get; set; } = "";
    }
}