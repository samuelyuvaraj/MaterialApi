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
            DimensionalTesting = request.Dimensional.Selected
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
            "Dimensional Sample Consumed"
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
            a.DimensionalSampleConsumed
        };

        for (var i = 0; i < values.Length; i++)
        {
            ws.Cell(row, i + 1).Value =
                values[i]?.ToString() ?? "";
        }
    }
}
