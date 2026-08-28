using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class IGQCGradeService
{
    private readonly string _excelPath;

    public IGQCGradeService()
    {
        _excelPath = Path.Combine(AppContext.BaseDirectory, "Data", "TestingGrade.xlsx");
    }

    public List<IGQCGrade> GetAll()
    {
        if (!File.Exists(_excelPath))
            return new List<IGQCGrade>();

        using var workbook = new XLWorkbook(_excelPath);
        var ws = workbook.Worksheet(1);
        var result = new List<IGQCGrade>();

        foreach (var row in ws.RowsUsed().Skip(1))
        {
            if (string.IsNullOrWhiteSpace(row.Cell(1).GetString()))
                continue;

            result.Add(new IGQCGrade
            {
                GradeId = row.Cell(1).GetString().Trim(),
                TestingType = row.Cell(2).GetString().Trim(),
                GradeName = row.Cell(3).GetString().Trim(),
                Equipment = row.Cell(4).GetString().Trim(),
                SampleConsumed = row.Cell(5).GetString().Trim(),
                ExpectedResult = row.Cell(6).GetString().Trim()
            });
        }

        return result;
    }

    public List<IGQCGrade> GetByTestingType(string testingType) =>
        GetAll().Where(x => string.Equals(x.TestingType.Trim(), testingType.Trim(),
            StringComparison.OrdinalIgnoreCase)).ToList();

    public IGQCGrade? GetById(string gradeId) =>
        GetAll().FirstOrDefault(x => string.Equals(x.GradeId.Trim(), gradeId.Trim(),
            StringComparison.OrdinalIgnoreCase));
}
