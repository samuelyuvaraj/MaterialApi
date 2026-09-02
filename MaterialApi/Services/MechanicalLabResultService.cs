using ClosedXML.Excel;
using MaterialApi.Models;
using System.Globalization;
using System.Text.RegularExpressions;

namespace MaterialApi.Services;

public class MechanicalLabResultService
{
    private readonly string _excelPath;

    private readonly IGQCTestingService _igqcService;
    private readonly MechanicalLabService _mechanicalLabService;

    private const string SheetName = "Mechanical Lab Results";

    private static readonly object FileLock = new();

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
        "Mechanical Grade",
        "Mechanical Quantity",
        "Mechanical Equipment",
        "Mechanical Sample Consumed",
        "Mechanical Status",
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

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public MechanicalLabResultService(
        IGQCTestingService igqcService,
        MechanicalLabService mechanicalLabService)
    {
        _igqcService = igqcService;
        _mechanicalLabService = mechanicalLabService;

        _excelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "Mechanical_Lab_Result_Data.xlsx");
    }

    // =========================================================
    // GET ACCEPTED MECHANICAL ASSIGNMENTS
    // =========================================================

    public List<MechanicalLabResult> GetAcceptedAssignments()
    {
        var mechanicalRecords = _mechanicalLabService
            .GetAll()
            .Where(x =>
                string.Equals(
                    x.MechanicalStatus?.Trim(),
                    "Accepted",
                    StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x =>
                $"{x.Date} {x.Time}")
            .ToList();

        var savedResults = GetSavedResults();

        var output = new List<MechanicalLabResult>();

        foreach (var mechanical in mechanicalRecords)
        {
            var record = ToRecord(mechanical);

            var savedRows = savedResults
                .Where(x =>
                    Same(
                        x.AssignmentId,
                        mechanical.AssignmentId))
                .OrderBy(x => x.Sno)
                .ToList();

            // -------------------------------------------------
            // Existing result already saved
            // -------------------------------------------------

            if (savedRows.Count > 0)
            {
                var first = savedRows[0];

                record.ResultId =
                    first.ResultId;

                record.ResultStatus =
                    first.ResultStatus;

                record.ResultEntryDate =
                    first.ResultEntryDate;

                record.ResultEntryTime =
                    first.ResultEntryTime;

                record.Results =
                    savedRows
                        .Select(x =>
                            new MechanicalLabResultRow
                            {
                                Sno = x.Sno,

                                TestParameter =
                                    x.TestParameter,

                                Specification =
                                    x.Specification,

                                ActualResult =
                                    x.ActualResult,

                                Conformance =
                                    x.Conformance
                            })
                        .ToList();
            }

            output.Add(record);
        }

        return output;
    }

    // =========================================================
    // GET ALL SAVED RESULTS
    // =========================================================

    public List<MechanicalLabResult> GetAll()
    {
        lock (FileLock)
        {
            if (!File.Exists(_excelPath))
                return new List<MechanicalLabResult>();

            using var workbook =
                new XLWorkbook(_excelPath);

            var ws =
                workbook.Worksheets
                    .FirstOrDefault(
                        x => x.Name == SheetName);

            if (ws == null ||
                ws.LastRowUsed() == null)
            {
                return new List<MechanicalLabResult>();
            }

            return ws.RowsUsed()
                .Skip(1)
                .Where(r =>
                    !string.IsNullOrWhiteSpace(
                        r.Cell(2).GetString()))
                .Select(ReadRow)
                .ToList();
        }
    }

    // =========================================================
    // GET RESULT BY ASSIGNMENT ID
    // =========================================================

    public MechanicalLabResult? GetByAssignmentId(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            return null;

        var accepted =
            GetAcceptedAssignments()
                .FirstOrDefault(x =>
                    Same(
                        x.AssignmentId,
                        assignmentId));

        if (accepted != null)
            return accepted;

        return GetAll()
            .Where(x =>
                Same(
                    x.AssignmentId,
                    assignmentId))
            .OrderByDescending(x =>
                x.ResultEntryDate)
            .ThenByDescending(x =>
                x.ResultEntryTime)
            .FirstOrDefault();
    }

    // =========================================================
    // COMPLETE MECHANICAL LAB RESULT
    // =========================================================

    public MechanicalLabResult Complete(
        MechanicalLabResultSaveRequest request)
    {
        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (request == null)
        {
            throw new ArgumentException(
                "Mechanical Lab result request is required.");
        }

        if (string.IsNullOrWhiteSpace(
                request.AssignmentId))
        {
            throw new ArgumentException(
                "Assignment ID is required.");
        }

        if (request.Results == null ||
            request.Results.Count == 0)
        {
            throw new ArgumentException(
                "Add at least one Mechanical Lab result row.");
        }

        // -----------------------------------------------------
        // GET MECHANICAL ASSIGNMENT
        // -----------------------------------------------------

        var mechanicalAssignment =
            _mechanicalLabService.GetByAssignmentId(
                request.AssignmentId);

        if (mechanicalAssignment == null)
        {
            throw new KeyNotFoundException(
                "Mechanical Lab assignment not found.");
        }

        // -----------------------------------------------------
        // ONLY ACCEPTED MATERIAL CAN HAVE RESULT
        // -----------------------------------------------------

        if (!string.Equals(
                mechanicalAssignment.MechanicalStatus?.Trim(),
                "Accepted",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Mechanical Lab assignment must be Accepted before entering results.");
        }

        // -----------------------------------------------------
        // BUILD RESULT ROWS
        // -----------------------------------------------------

        var rows =
            new List<MechanicalLabResultRow>();

        var sno = 1;

        foreach (var input in request.Results)
        {
            var parameter =
                input.TestParameter?.Trim() ?? "";

            var specification =
                input.Specification?.Trim() ?? "";

            var actual =
                input.ActualResult?.Trim() ?? "";

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

            if (string.IsNullOrWhiteSpace(actual))
            {
                throw new ArgumentException(
                    $"Actual Result is required for row {sno}.");
            }

            rows.Add(
                new MechanicalLabResultRow
                {
                    Sno = sno,

                    TestParameter =
                        parameter,

                    Specification =
                        specification,

                    ActualResult =
                        actual,

                    Conformance =
                        Evaluate(
                            specification,
                            actual)
                });

            sno++;
        }

        // -----------------------------------------------------
        // OVERALL RESULT STATUS
        // -----------------------------------------------------

        var overall =
            rows.All(x =>
                Same(
                    x.Conformance,
                    "Conforming"))
            ? "Completed"
            : "Completed - Not Conforming";

        var now = DateTime.Now;

        var resultId =
            $"MLR-{now:yyyyMMddHHmmssfff}";

        // -----------------------------------------------------
        // SAVE TO MECHANICAL RESULT EXCEL
        // -----------------------------------------------------

        lock (FileLock)
        {
            Directory.CreateDirectory(
                Path.GetDirectoryName(
                    _excelPath)!);

            using var workbook =
                File.Exists(_excelPath)
                    ? new XLWorkbook(_excelPath)
                    : new XLWorkbook();

            var ws =
                workbook.Worksheets
                    .FirstOrDefault(
                        x => x.Name == SheetName)
                ?? workbook.Worksheets.Add(
                    SheetName);

            EnsureHeaders(ws);

            // -------------------------------------------------
            // REMOVE OLD RESULT FOR SAME ASSIGNMENT
            // -------------------------------------------------

            var existing =
                ws.RowsUsed()
                    .Skip(1)
                    .Where(r =>
                        Same(
                            r.Cell(2).GetString(),
                            mechanicalAssignment.AssignmentId))
                    .ToList();

            foreach (var row in existing)
            {
                row.Delete();
            }

            // -------------------------------------------------
            // NEXT ROW
            // -------------------------------------------------

            var rowNumber =
                (ws.LastRowUsed()?.RowNumber() ?? 1) + 1;

            // -------------------------------------------------
            // WRITE ALL TEST RESULTS
            // -------------------------------------------------

            foreach (var test in rows)
            {
                WriteRow(
                    ws,
                    rowNumber,
                    resultId,
                    mechanicalAssignment,
                    test,
                    overall,
                    now);

                rowNumber++;
            }

            // -------------------------------------------------
            // FORMAT
            // -------------------------------------------------

            ws.Row(1)
                .Style
                .Font
                .Bold = true;

            ws.Columns(
                    1,
                    Headers.Length)
                .AdjustToContents();

            // -------------------------------------------------
            // SAVE
            // -------------------------------------------------

            workbook.SaveAs(_excelPath);
        }

        // -----------------------------------------------------
        // UPDATE IGQC DATA
        //
        // IGQC_Data.xlsx:
        //
        // Column 25 = Chemical Status
        // Column 26 = Mechanical Status
        // Column 27 = Dimensional Status
        // -----------------------------------------------------

        _igqcService.MarkMechanicalResultCompleted(
            mechanicalAssignment.AssignmentId);

        // -----------------------------------------------------
        // RETURN RESULT
        // -----------------------------------------------------

        return new MechanicalLabResult
        {
            ResultId =
                resultId,

            AssignmentId =
                mechanicalAssignment.AssignmentId,

            Date =
                mechanicalAssignment.Date,

            Time =
                mechanicalAssignment.Time,

            Po =
                mechanicalAssignment.Po,

            So =
                mechanicalAssignment.So,

            MaterialId =
                mechanicalAssignment.MaterialId,

            MaterialName =
                mechanicalAssignment.MaterialName,

            Grn =
                mechanicalAssignment.Grn,

            Unit =
                mechanicalAssignment.Unit,

            MechanicalGrade =
                mechanicalAssignment.MechanicalGrade,

            MechanicalQuantity =
                mechanicalAssignment.MechanicalQuantity,

            MechanicalEquipment =
                mechanicalAssignment.MechanicalEquipment,

            MechanicalSampleConsumed =
                mechanicalAssignment.MechanicalSampleConsumed,

            MechanicalStatus =
                "Completed",

            // Accepted date/time are not taken from
            // IGQCTestingAssignment because those properties
            // do not exist there.

            AcceptedDate = "",

            AcceptedTime = "",

            ResultStatus =
                overall,

            ResultEntryDate =
                now.ToString("yyyy-MM-dd"),

            ResultEntryTime =
                now.ToString("HH:mm:ss"),

            Vendor =
                mechanicalAssignment.Vendor,

            Results =
                rows
        };
    }

    // =========================================================
    // WRITE ONE EXCEL ROW
    // =========================================================

    private static void WriteRow(
        IXLWorksheet ws,
        int row,
        string resultId,
        MechanicalLabRecord assignment,
        MechanicalLabResultRow test,
        string overall,
        DateTime now)
    {
        var values = new object?[]
        {
            // 1
            resultId,

            // 2-10
            assignment.AssignmentId,
            assignment.Date,
            assignment.Time,
            assignment.Po,
            assignment.So,
            assignment.MaterialId,
            assignment.MaterialName,
            assignment.Grn,
            assignment.Unit,

            // 11-14
            assignment.MechanicalGrade,
            assignment.MechanicalQuantity,
            assignment.MechanicalEquipment,
            assignment.MechanicalSampleConsumed,

            // 15
            "Completed",

            // 16-17
            "", // Accepted Date
            "", // Accepted Time

            // 18-22
            test.Sno,
            test.TestParameter,
            test.Specification,
            test.ActualResult,
            test.Conformance,

            // 23
            overall,

            // 24-25
            now.ToString("yyyy-MM-dd"),
            now.ToString("HH:mm:ss"),

            // 26
            assignment.Vendor
        };

        for (var i = 0;
             i < values.Length;
             i++)
        {
            var value = values[i];

            if (value == null)
            {
                ws.Cell(
                    row,
                    i + 1)
                    .Clear();
            }
            else if (value is decimal decimalValue)
            {
                ws.Cell(
                    row,
                    i + 1)
                    .Value =
                    decimalValue;
            }
            else if (value is int intValue)
            {
                ws.Cell(
                    row,
                    i + 1)
                    .Value =
                    intValue;
            }
            else
            {
                ws.Cell(
                    row,
                    i + 1)
                    .Value =
                    value.ToString() ?? "";
            }
        }
    }

    // =========================================================
    // GET SAVED RESULT ROWS
    // =========================================================

    private List<SavedRow> GetSavedResults()
    {
        lock (FileLock)
        {
            if (!File.Exists(_excelPath))
                return new List<SavedRow>();

            using var workbook =
                new XLWorkbook(_excelPath);

            var ws =
                workbook.Worksheets
                    .FirstOrDefault(
                        x => x.Name == SheetName);

            if (ws == null ||
                ws.LastRowUsed() == null)
            {
                return new List<SavedRow>();
            }

            return ws.RowsUsed()
                .Skip(1)
                .Where(r =>
                    !string.IsNullOrWhiteSpace(
                        r.Cell(2).GetString()))
                .Select(r =>
                    new SavedRow
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
    // CONVERT MECHANICAL LAB RECORD
    // =========================================================

    private static MechanicalLabResult ToRecord(
        MechanicalLabRecord x)
    {
        return new MechanicalLabResult
        {
            AssignmentId =
                x.AssignmentId,

            Date =
                x.Date,

            Time =
                x.Time,

            Po =
                x.Po,

            So =
                x.So,

            MaterialId =
                x.MaterialId,

            MaterialName =
                x.MaterialName,

            Grn =
                x.Grn,

            Unit =
                x.Unit,

            MechanicalGrade =
                x.MechanicalGrade,

            MechanicalQuantity =
                x.MechanicalQuantity,

            MechanicalEquipment =
                x.MechanicalEquipment,

            MechanicalSampleConsumed =
                x.MechanicalSampleConsumed,

            MechanicalStatus =
                x.MechanicalStatus,

            Vendor =
                x.Vendor,

            ResultStatus =
                "Pending",

            Results =
                new List<MechanicalLabResultRow>()
        };
    }

    // =========================================================
    // CONFORMANCE EVALUATION
    // =========================================================

    private static string Evaluate(
        string specification,
        string actual)
    {
        var spec =
            specification.Trim();

        var result =
            actual.Trim();

        // =====================================================
        // NUMERIC ACTUAL RESULT
        // =====================================================

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

            // =================================================
            // RANGE
            //
            // Example:
            // 50-100
            // =================================================

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

            // =================================================
            // OPERATORS
            //
            // Examples:
            // <=100
            // >=50
            // <100
            // >50
            // =================================================

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
                        "<=" =>
                            actualNumber <= limit,

                        ">=" =>
                            actualNumber >= limit,

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

            // =================================================
            // EXACT NUMBER
            // =================================================

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

        // =====================================================
        // TEXT RESULT
        // =====================================================

        return Same(
            specification,
            actual)
            ? "Conforming"
            : "Not Conforming";
    }

    // =========================================================
    // ENSURE EXCEL HEADERS
    // =========================================================

    private static void EnsureHeaders(
        IXLWorksheet ws)
    {
        for (var i = 0;
             i < Headers.Length;
             i++)
        {
            ws.Cell(
                    1,
                    i + 1)
                .Value =
                Headers[i];
        }
    }

    // =========================================================
    // READ EXCEL ROW
    // =========================================================

    private static MechanicalLabResult ReadRow(
        IXLRow row)
    {
        return new MechanicalLabResult
        {
            ResultId =
                Cell(row, 1),

            AssignmentId =
                Cell(row, 2),

            Date =
                Cell(row, 3),

            Time =
                Cell(row, 4),

            Po =
                Cell(row, 5),

            So =
                Cell(row, 6),

            MaterialId =
                Cell(row, 7),

            MaterialName =
                Cell(row, 8),

            Grn =
                Cell(row, 9),

            Unit =
                Cell(row, 10),

            MechanicalGrade =
                Cell(row, 11),

            MechanicalQuantity =
                DecimalValue(row, 12),

            MechanicalEquipment =
                Cell(row, 13),

            MechanicalSampleConsumed =
                Cell(row, 14),

            MechanicalStatus =
                Cell(row, 15),

            AcceptedDate =
                Cell(row, 16),

            AcceptedTime =
                Cell(row, 17),

            ResultStatus =
                Cell(row, 23),

            ResultEntryDate =
                Cell(row, 24),

            ResultEntryTime =
                Cell(row, 25),

            Vendor =
                Cell(row, 26)
        };
    }

    // =========================================================
    // STRING CELL
    // =========================================================

    private static string Cell(
        IXLRow row,
        int column)
    {
        return row.Cell(column)
            .GetString()
            .Trim();
    }

    // =========================================================
    // INTEGER CELL
    // =========================================================

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

    // =========================================================
    // DECIMAL CELL
    // =========================================================

    private static decimal? DecimalValue(
        IXLRow row,
        int column)
    {
        var text =
            row.Cell(column)
                .GetString();

        return decimal.TryParse(
            text,
            out var value)
            ? value
            : null;
    }

    // =========================================================
    // STRING HELPER
    // =========================================================

    private static string S(
        IXLRow row,
        int column)
    {
        return row.Cell(column)
            .GetString()
            .Trim();
    }

    // =========================================================
    // CASE-INSENSITIVE COMPARE
    // =========================================================

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
    // SAVED EXCEL RESULT ROW
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