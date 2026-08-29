using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class ChemicalLabService
{
    private readonly string _igqcExcelPath;
    private readonly string _chemicalLabExcelPath;

    private static readonly object FileLock = new();

    public ChemicalLabService()
    {
        _igqcExcelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "IGQC_Data.xlsx"
        );

        _chemicalLabExcelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "Chemical_Lab_Data.xlsm"
        );
    }

    // =========================================================
    // GET ALL CHEMICAL LAB RECORDS
    // Only records where Chemical Testing = Yes
    // =========================================================

    public List<ChemicalLabRecord> GetAll()
    {
        var result = new List<ChemicalLabRecord>();

        if (!File.Exists(_igqcExcelPath))
            return result;

        using var workbook = new XLWorkbook(_igqcExcelPath);

        var ws = workbook.Worksheets.FirstOrDefault();

        if (ws == null)
            return result;

        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int row = 2; row <= lastRow; row++)
        {
            var chemicalTesting =
                ws.Cell(row, 10).GetString().Trim();

            // Only Chemical Testing records
            if (!string.Equals(
                    chemicalTesting,
                    "Yes",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var record = ReadChemicalRecord(ws, row);

            // If this assignment was already accepted,
            // use the Chemical Lab Excel record.
            var savedRecord = GetSavedRecord(record.AssignmentId);

            if (savedRecord != null)
            {
                result.Add(savedRecord);
            }
            else
            {
                result.Add(record);
            }
        }

        return result;
    }


    // =========================================================
    // GET ONE CHEMICAL LAB RECORD
    // =========================================================

    public ChemicalLabRecord? GetByAssignmentId(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            return null;

        var records = GetAll();

        return records.FirstOrDefault(x =>
            string.Equals(
                x.AssignmentId.Trim(),
                assignmentId.Trim(),
                StringComparison.OrdinalIgnoreCase));
    }


    // =========================================================
    // ACCEPT CHEMICAL LAB RECORD
    // =========================================================

    public ChemicalLabRecord Accept(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            throw new ArgumentException(
                "Assignment ID is required.");

        lock (FileLock)
        {
            var existing =
                GetByAssignmentId(assignmentId);

            if (existing == null)
            {
                throw new KeyNotFoundException(
                    $"Chemical testing assignment '{assignmentId}' was not found.");
            }

            // Already accepted
            if (string.Equals(
                    existing.ChemicalStatus,
                    "Accepted",
                    StringComparison.OrdinalIgnoreCase))
            {
                return existing;
            }

            var now = DateTime.Now;

            existing.ChemicalStatus = "Accepted";
            existing.AcceptedDate =
                now.ToString("yyyy-MM-dd");

            existing.AcceptedTime =
                now.ToString("HH:mm:ss");

            Directory.CreateDirectory(
                Path.GetDirectoryName(_chemicalLabExcelPath)!
            );

            using var workbook =
                File.Exists(_chemicalLabExcelPath)
                    ? new XLWorkbook(_chemicalLabExcelPath)
                    : new XLWorkbook();

            var ws =
                workbook.Worksheets.FirstOrDefault()
                ?? workbook.AddWorksheet("Chemical Lab");

            EnsureHeaders(ws);

            // Check whether assignment already exists
            var existingRow =
                FindAssignmentRow(
                    ws,
                    existing.AssignmentId);

            if (existingRow > 0)
            {
                Write(ws, existingRow, existing);
            }
            else
            {
                var nextRow =
                    ws.LastRowUsed()?.RowNumber() + 1 ?? 2;

                Write(ws, nextRow, existing);
            }

            workbook.SaveAs(_chemicalLabExcelPath);

            return existing;
        }
    }


    // =========================================================
    // READ IGQC RECORD
    // =========================================================

    private static ChemicalLabRecord ReadChemicalRecord(
        IXLWorksheet ws,
        int row)
    {
        return new ChemicalLabRecord
        {
            AssignmentId = Cell(ws, row, 1),
            Date = Cell(ws, row, 2),
            Time = Cell(ws, row, 3),

            Po = Cell(ws, row, 4),
            So = Cell(ws, row, 5),
            MaterialId = Cell(ws, row, 6),
            Grn = Cell(ws, row, 7),
            MaterialName = Cell(ws, row, 8),
            Unit = Cell(ws, row, 9),

            // Chemical columns only
            ChemicalGrade = Cell(ws, row, 13),

            ChemicalQuantity =
                DecimalCell(ws, row, 16),

            ChemicalEquipment =
                Cell(ws, row, 19),

            ChemicalSampleConsumed =
                Cell(ws, row, 22),

            ChemicalStatus = "Pending"
        };
    }


    // =========================================================
    // READ SAVED CHEMICAL LAB RECORD
    // =========================================================

    private ChemicalLabRecord? GetSavedRecord(
        string assignmentId)
    {
        if (!File.Exists(_chemicalLabExcelPath))
            return null;

        using var workbook =
            new XLWorkbook(_chemicalLabExcelPath);

        var ws =
            workbook.Worksheets.FirstOrDefault();

        if (ws == null)
            return null;

        var lastRow =
            ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int row = 2; row <= lastRow; row++)
        {
            var id = Cell(ws, row, 1);

            if (string.Equals(
                    id,
                    assignmentId,
                    StringComparison.OrdinalIgnoreCase))
            {
                return new ChemicalLabRecord
                {
                    AssignmentId = Cell(ws, row, 1),
                    Date = Cell(ws, row, 2),
                    Time = Cell(ws, row, 3),

                    Po = Cell(ws, row, 4),
                    So = Cell(ws, row, 5),
                    MaterialId = Cell(ws, row, 6),
                    Grn = Cell(ws, row, 7),
                    MaterialName = Cell(ws, row, 8),
                    Unit = Cell(ws, row, 9),

                    ChemicalGrade = Cell(ws, row, 10),

                    ChemicalQuantity =
                        DecimalCell(ws, row, 11),

                    ChemicalEquipment =
                        Cell(ws, row, 12),

                    ChemicalSampleConsumed =
                        Cell(ws, row, 13),

                    ChemicalStatus =
                        Cell(ws, row, 14),

                    AcceptedDate =
                        Cell(ws, row, 15),

                    AcceptedTime =
                        Cell(ws, row, 16)
                };
            }
        }

        return null;
    }


    // =========================================================
    // EXCEL HEADERS
    // =========================================================

    private static void EnsureHeaders(
        IXLWorksheet ws)
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
            "Chemical Grade",
            "Chemical Quantity",
            "Chemical Equipment",
            "Chemical Sample Consumed",
            "Chemical Status",
            "Accepted Date",
            "Accepted Time"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value =
                headers[i];
        }
    }


    // =========================================================
    // WRITE EXCEL ROW
    // =========================================================

    private static void Write(
        IXLWorksheet ws,
        int row,
        ChemicalLabRecord record)
    {
        var values = new object?[]
        {
            record.AssignmentId,
            record.Date,
            record.Time,

            record.Po,
            record.So,
            record.MaterialId,
            record.Grn,
            record.MaterialName,
            record.Unit,

            record.ChemicalGrade,
            record.ChemicalQuantity,
            record.ChemicalEquipment,
            record.ChemicalSampleConsumed,
            record.ChemicalStatus,

            record.AcceptedDate,
            record.AcceptedTime
        };

        for (int i = 0; i < values.Length; i++)
        {
            ws.Cell(row, i + 1).Value =
                values[i]?.ToString() ?? "";
        }
    }


    // =========================================================
    // FIND ASSIGNMENT ROW
    // =========================================================

    private static int FindAssignmentRow(
        IXLWorksheet ws,
        string assignmentId)
    {
        var lastRow =
            ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int row = 2; row <= lastRow; row++)
        {
            if (string.Equals(
                    Cell(ws, row, 1),
                    assignmentId,
                    StringComparison.OrdinalIgnoreCase))
            {
                return row;
            }
        }

        return 0;
    }


    // =========================================================
    // HELPERS
    // =========================================================

    private static string Cell(
        IXLWorksheet ws,
        int row,
        int column)
    {
        return ws.Cell(row, column)
                 .GetString()
                 .Trim();
    }


    private static decimal? DecimalCell(
        IXLWorksheet ws,
        int row,
        int column)
    {
        var value =
            ws.Cell(row, column)
              .GetString()
              .Trim();

        if (decimal.TryParse(
                value,
                out var result))
        {
            return result;
        }

        return null;
    }
}