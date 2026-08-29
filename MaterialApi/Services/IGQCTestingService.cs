using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class IGQCTestingService
{
    private readonly string _excelPath;

    // Prevent two simultaneous requests from writing the workbook at once.
    private static readonly object FileLock = new();

    public IGQCTestingService()
    {
        _excelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "IGQC_Data.xlsx"
        );
    }

    public IGQCTestingAssignment Save(
        IGQCTestingRequest request,
        IGQCGradeService gradeService)
    {
        ValidateRequest(request);

        var now = DateTime.Now;

        var assignment = new IGQCTestingAssignment
        {
            AssignmentId = CreateAssignmentId(),
            Date = now.ToString("yyyy-MM-dd"),
            Time = now.ToString("HH:mm:ss"),

            Po = Clean(request.Po),
            So = Clean(request.So),
            MaterialId = Clean(request.MaterialId),
            Grn = Clean(request.Grn),
            MaterialName = Clean(request.MaterialName),
            Unit = Clean(request.Unit),

            ChemicalTesting = request.Chemical.Selected,
            MechanicalTesting = request.Mechanical.Selected,
            DimensionalTesting = request.Dimensional.Selected,

            ChemicalStatus = request.Chemical.Selected ? "Pending" : "",
            MechanicalStatus = request.Mechanical.Selected ? "Pending" : "",
            DimensionalStatus = request.Dimensional.Selected ? "Pending" : ""

        };

        if (request.Chemical.Selected)
        {
            var grade = FindGrade(
                gradeService,
                request.Chemical.GradeId,
                "Chemical Testing"
            );

            assignment.ChemicalGrade = grade.GradeName;
            assignment.ChemicalQuantity = request.Chemical.Quantity;
            assignment.ChemicalEquipment = Clean(grade.Equipment);
            assignment.ChemicalSampleConsumed = Clean(grade.SampleConsumed);
        }

        if (request.Mechanical.Selected)
        {
            var grade = FindGrade(
                gradeService,
                request.Mechanical.GradeId,
                "Mechanical Testing"
            );

            assignment.MechanicalGrade = grade.GradeName;
            assignment.MechanicalQuantity = request.Mechanical.Quantity;
            assignment.MechanicalEquipment = Clean(grade.Equipment);
            assignment.MechanicalSampleConsumed = Clean(grade.SampleConsumed);
        }

        if (request.Dimensional.Selected)
        {
            var grade = FindGrade(
                gradeService,
                request.Dimensional.GradeId,
                "Dimensional Testing"
            );

            assignment.DimensionalGrade = grade.GradeName;
            assignment.DimensionalQuantity = request.Dimensional.Quantity;
            assignment.DimensionalEquipment = Clean(grade.Equipment);
            assignment.DimensionalSampleConsumed = Clean(grade.SampleConsumed);
        }

        lock (FileLock)
        {
            Directory.CreateDirectory(
                Path.GetDirectoryName(_excelPath)!
            );

            using var workbook = File.Exists(_excelPath)
                ? new XLWorkbook(_excelPath)
                : new XLWorkbook();

            var ws = workbook.Worksheets.FirstOrDefault()
                     ?? workbook.AddWorksheet("Sheet1");

            EnsureHeaders(ws);

            var nextRow = ws.LastRowUsed()?.RowNumber() + 1 ?? 2;

            Write(ws, nextRow, assignment);

            workbook.SaveAs(_excelPath);
        }

        return assignment;
    }

    private static void ValidateRequest(IGQCTestingRequest request)
    {
        if (request == null)
            throw new ArgumentException("Testing request is required.");

        if (string.IsNullOrWhiteSpace(request.Po))
            throw new ArgumentException("Purchase order is required.");

        if (string.IsNullOrWhiteSpace(request.So))
            throw new ArgumentException("Sales order is required.");

        if (string.IsNullOrWhiteSpace(request.MaterialId))
            throw new ArgumentException("Material identifier is required.");

        if (string.IsNullOrWhiteSpace(request.Grn))
            throw new ArgumentException("GRN is required.");

        var selected =
            request.Chemical.Selected ||
            request.Mechanical.Selected ||
            request.Dimensional.Selected;

        if (!selected)
            throw new ArgumentException(
                "Select at least one testing type."
            );

        ValidateSelection(
            request.Chemical,
            "Chemical Testing",
            request.Available
        );

        ValidateSelection(
            request.Mechanical,
            "Mechanical Testing",
            request.Available
        );

        ValidateSelection(
            request.Dimensional,
            "Dimensional Testing",
            request.Available
        );
    }

    private static void ValidateSelection(
        IGQCTestingSelection selection,
        string testingType,
        decimal? available)
    {
        if (!selection.Selected)
            return;

        if (string.IsNullOrWhiteSpace(selection.GradeId))
            throw new ArgumentException(
                $"Select a grade for {testingType}."
            );

        if (!selection.Quantity.HasValue ||
            selection.Quantity.Value <= 0)
        {
            throw new ArgumentException(
                $"Enter a quantity greater than zero for {testingType}."
            );
        }

        if (available.HasValue &&
            selection.Quantity.Value > available.Value)
        {
            throw new ArgumentException(
                $"{testingType} quantity cannot exceed available quantity ({available.Value})."
            );
        }
    }

    private static IGQCGrade FindGrade(
        IGQCGradeService service,
        string gradeId,
        string testingType)
    {
        var grade = service.GetById(gradeId);

        if (grade == null)
            throw new ArgumentException(
                $"Grade '{gradeId}' was not found."
            );

        if (!string.Equals(
                grade.TestingType?.Trim(),
                testingType,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                $"Grade '{gradeId}' does not belong to {testingType}."
            );
        }

        return grade;
    }

    private static string CreateAssignmentId()
    {
        return "IGQC-" +
               DateTime.Now.ToString("yyyyMMddHHmmssfff");
    }

    private static string Clean(string? value)
    {
        return value?.Trim() ?? "";
    }

    private static void EnsureHeaders(IXLWorksheet ws)
    {
        string[] headers =
        {
            "Assignment ID",
            "Date",
            "Time",
            "PO",
            "SO",
            "Material ID",
            "GRN",
            "Material Name",
            "Unit",
            "Chemical Testing",
            "Mechanical Testing",
            "Dimensional Testing",
            "Chemical Grade",
            "Mechanical Grade",
            "Dimensional Grade",
            "Chemical Quantity",
            "Mechanical Quantity",
            "Dimensional Quantity",
            "Chemical Equipment",
            "Mechanical Equipment",
            "Dimensional Equipment",
            "Chemical Sample Consumed",
            "Mechanical Sample Consumed",
            "Dimensional Sample Consumed",
            "Chemical Status",
            "Mechanical Status",
            "Dimensional Status"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
        }
    }

    private static void Write(
        IXLWorksheet ws,
        int row,
        IGQCTestingAssignment a)
    {
        var values = new object?[]
        {
            a.AssignmentId,
            a.Date,
            a.Time,
            a.Po,
            a.So,
            a.MaterialId,
            a.Grn,
            a.MaterialName,
            a.Unit,

            a.ChemicalTesting ? "Yes" : "No",
            a.MechanicalTesting ? "Yes" : "No",
            a.DimensionalTesting ? "Yes" : "No",

            a.ChemicalGrade,
            a.MechanicalGrade,
            a.DimensionalGrade,

            a.ChemicalQuantity,
            a.MechanicalQuantity,
            a.DimensionalQuantity,

            a.ChemicalEquipment,
            a.MechanicalEquipment,
            a.DimensionalEquipment,

            a.ChemicalSampleConsumed,
            a.MechanicalSampleConsumed,
            a.DimensionalSampleConsumed,

            a.ChemicalStatus,
            a.MechanicalStatus,
            a.DimensionalStatus
        };

        for (var i = 0; i < values.Length; i++)
        {
            ws.Cell(row, i + 1).Value =
                values[i]?.ToString() ?? "";
        }
    }
    
// =========================================================
// ADD THESE METHODS INSIDE IGQCTestingService
// =========================================================

public List<IGQCTestingAssignment> GetAll()
{
    lock (FileLock)
    {
        if (!File.Exists(_excelPath))
            return new List<IGQCTestingAssignment>();

        using var workbook = new XLWorkbook(_excelPath);

        var ws = workbook.Worksheets.FirstOrDefault();

        if (ws == null || ws.LastRowUsed() == null)
            return new List<IGQCTestingAssignment>();

        var records = new List<IGQCTestingAssignment>();

        foreach (var row in ws.RowsUsed().Skip(1))
        {
            if (string.IsNullOrWhiteSpace(row.Cell(1).GetString()))
                continue;

            records.Add(ReadRecord(row));
        }

        return records;
    }
}

public List<IGQCTestingAssignment> Search(string? search)
{
    var records = GetAll();

    if (string.IsNullOrWhiteSpace(search))
        return records;

    var value = search.Trim();

    return records
        .Where(x =>
            Contains(x.AssignmentId, value) ||
            Contains(x.Po, value) ||
            Contains(x.So, value) ||
            Contains(x.MaterialId, value) ||
            Contains(x.Grn, value))
        .ToList();
}

public IGQCTestingAssignment? GetByAssignmentId(
    string assignmentId)
{
    if (string.IsNullOrWhiteSpace(assignmentId))
        return null;

    return GetAll()
        .FirstOrDefault(x =>
            string.Equals(
                x.AssignmentId?.Trim(),
                assignmentId.Trim(),
                StringComparison.OrdinalIgnoreCase));
}

public List<IGQCTestingAssignment> FindByQr(
    string po,
    string so,
    string materialId,
    string materialName,
    string grn)
{
    return GetAll()
        .Where(x =>
            string.Equals(
                x.Po?.Trim(),
                po?.Trim(),
                StringComparison.OrdinalIgnoreCase) &&

            string.Equals(
                x.So?.Trim(),
                so?.Trim(),
                StringComparison.OrdinalIgnoreCase) &&

            string.Equals(
                x.MaterialId?.Trim(),
                materialId?.Trim(),
                StringComparison.OrdinalIgnoreCase) &&

            string.Equals(
                x.Grn?.Trim(),
                grn?.Trim(),
                StringComparison.OrdinalIgnoreCase))
        .ToList();
}

private static bool Contains(
    string? source,
    string search)
{
    return !string.IsNullOrWhiteSpace(source) &&
           source.Contains(
               search,
               StringComparison.OrdinalIgnoreCase);
}

private static IGQCTestingAssignment ReadRecord(
    IXLRow row)
{
    return new IGQCTestingAssignment
    {
        AssignmentId = Cell(row, 1),
        Date = Cell(row, 2),
        Time = Cell(row, 3),
        Po = Cell(row, 4),
        So = Cell(row, 5),
        MaterialId = Cell(row, 6),
        Grn = Cell(row, 7),
        MaterialName = Cell(row, 8),
        Unit = Cell(row, 9),

        ChemicalTesting = IsYes(Cell(row, 10)),
        MechanicalTesting = IsYes(Cell(row, 11)),
        DimensionalTesting = IsYes(Cell(row, 12)),

        ChemicalGrade = Cell(row, 13),
        MechanicalGrade = Cell(row, 14),
        DimensionalGrade = Cell(row, 15),

        ChemicalQuantity = DecimalValue(row, 16),
        MechanicalQuantity = DecimalValue(row, 17),
        DimensionalQuantity = DecimalValue(row, 18),

        ChemicalEquipment = Cell(row, 19),
        MechanicalEquipment = Cell(row, 20),
        DimensionalEquipment = Cell(row, 21),

        ChemicalSampleConsumed = Cell(row, 22),
        MechanicalSampleConsumed = Cell(row, 23),
        DimensionalSampleConsumed = Cell(row, 24),

        // These are the new columns 25-27.
        ChemicalStatus = Cell(row, 25),
        MechanicalStatus = Cell(row, 26),
        DimensionalStatus = Cell(row, 27)
    };
}

private static string Cell(
    IXLRow row,
    int column)
{
    return row.Cell(column)
        .GetString()
        .Trim();
}

private static bool IsYes(string value)
{
    return string.Equals(
        value?.Trim(),
        "Yes",
        StringComparison.OrdinalIgnoreCase);
}

private static decimal? DecimalValue(
    IXLRow row,
    int column)
{
    var text = row.Cell(column).GetString();

    return decimal.TryParse(
        text,
        out var value)
        ? value
        : null;
}

}
