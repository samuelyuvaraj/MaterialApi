using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class ExcelMaterialService
{
    private readonly string _dataFolder;
    private readonly string _excelPath;

    public ExcelMaterialService()
    {
        _dataFolder = Path.Combine(
            AppContext.BaseDirectory,
            "Data"
        );

        _excelPath = Path.Combine(
            _dataFolder,
            "MaterialMaster.xlsx"
        );
    }

    public Material? GetMaterialByIdentifier(
        string identifier)
    {
        if (!File.Exists(_excelPath))
        {
            return null;
        }

        using var workbook =
            new XLWorkbook(_excelPath);

        var worksheet =
            workbook.Worksheet(1);

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            var rowIdentifier =
                row.Cell(1)
                    .GetString()
                    .Trim();

            if (!string.Equals(
                    rowIdentifier,
                    identifier.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return new Material
            {
                Identifier =
                    row.Cell(1).GetString().Trim(),

                Revision =
                    row.Cell(2).GetString().Trim(),

                UniqueIdentifier =
                    row.Cell(3).GetString().Trim(),

                Name =
                    row.Cell(4).GetString().Trim(),

                Description =
                    row.Cell(5).GetString().Trim(),

                UnitOfMeasure =
                    row.Cell(6).GetString().Trim(),

                LogisticClassIdentifier =
                    row.Cell(7).GetString().Trim(),

                MaterialClass =
                    row.Cell(8).GetString().Trim(),

                VolumeValue =
                    GetDecimalValue(row.Cell(9)),

                VolumeUnitOfMeasure =
                    row.Cell(10).GetString().Trim(),

                WeightValue =
                    GetDecimalValue(row.Cell(11)),

                WeightUnitOfMeasure =
                    row.Cell(12).GetString().Trim()
            };
        }

        return null;
    }


    private static decimal? GetDecimalValue(
        IXLCell cell)
    {
        if (cell.IsEmpty())
        {
            return null;
        }

        if (cell.TryGetValue<decimal>(
                out var value))
        {
            return value;
        }

        if (decimal.TryParse(
                cell.GetString().Trim(),
                out var parsed))
        {
            return parsed;
        }

        return null;
    }
}